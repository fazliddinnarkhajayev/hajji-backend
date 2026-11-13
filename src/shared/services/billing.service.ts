import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { effectiveStatusSql } from '../dao/group-status';
import { PaginatedResult } from '../interfaces/pagination.interface';

/** One activation covers one pilgrim for one trip. */
export const COINS_PER_ACTIVATION = 1;

export const ACTIVATION_STATUSES = ['IN_USE', 'FREE', 'CONSUMED', 'REFUND_PENDING', 'REFUNDED'] as const;
export type ActivationStatus = (typeof ACTIVATION_STATUSES)[number];
/** Statuses covered by the partial unique index: at most one per pilgrim and agency. */
export const LIVE_ACTIVATION_STATUSES: ActivationStatus[] = ['IN_USE', 'FREE', 'REFUND_PENDING'];

export const TRANSACTION_TYPES = ['TOPUP', 'ACTIVATION', 'REFUND', 'ADJUSTMENT'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const REFUND_REASONS = ['WRONG_PILGRIM', 'TRIP_CANCELLED', 'DOUBLE_CHARGE', 'OTHER'] as const;
export type RefundReason = (typeof REFUND_REASONS)[number];

export interface PilgrimActivation {
  id: string;
  agency_id: string;
  pilgrim_id: string;
  status: ActivationStatus;
  coins: number;
  group_id: string | null;
  transaction_id: string | null;
  created_at: Date;
  updated_at: Date;
  consumed_at: Date | null;
}

const A = TABLE_NAMES.PILGRIM_ACTIVATIONS;
const T = TABLE_NAMES.WALLET_TRANSACTIONS;
const AG = TABLE_NAMES.AGENCIES;

/** Thrown when the agency lacks coins. The filter passes `code`, `need` and `have` to the client. */
export class InsufficientCoinsException extends HttpException {
  constructor(need: number, have: number) {
    super(
      { message: `Not enough coins: ${need} needed, ${have} available`, code: 'INSUFFICIENT_COINS', need, have },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }
}

/**
 * The coin rules shared by the agency and admin modules. Every method that changes money takes the
 * caller's transaction, so a failed group add or refund never leaves a half-written balance.
 */
@Injectable()
export class BillingService {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  // ── Balance and ledger ─────────────────────────────────────

  /**
   * Adds `coins` (negative to take) and writes the ledger row. The balance check is part of the
   * UPDATE, so two operators clicking at once can't push it below zero.
   */
  async move(
    trx: Knex.Transaction,
    agencyId: string,
    coins: number,
    entry: {
      type: TransactionType;
      created_by_id?: string | null;
      pilgrim_count?: number | null;
      group_id?: string | null;
      currency_code?: string | null;
      coin_price?: number | string | null;
      paid_amount?: number | string | null;
      reference?: string | null;
      note?: string | null;
    },
  ): Promise<{ id: string; coins_after: number }> {
    const q = trx(AG).where({ id: agencyId });
    if (coins < 0) q.where('coin_balance', '>=', -coins);
    const [row] = await q.update({ coin_balance: trx.raw('coin_balance + ?', [coins]) }).returning('coin_balance');
    if (!row) {
      const agency = await trx(AG).where({ id: agencyId }).first('coin_balance');
      if (!agency) throw new NotFoundException('Agency not found');
      throw new InsufficientCoinsException(-coins, agency.coin_balance);
    }
    const [tx] = await trx(T)
      .insert({ agency_id: agencyId, coins, coins_after: row.coin_balance, ...entry })
      .returning(['id', 'coins_after']);
    return tx;
  }

  // ── Activations ────────────────────────────────────────────

  async findLive(trx: Knex.Transaction | Knex, agencyId: string, pilgrimId: string): Promise<PilgrimActivation | undefined> {
    return trx(A)
      .where({ agency_id: agencyId, pilgrim_id: pilgrimId })
      .whereIn('status', LIVE_ACTIVATION_STATUSES)
      .forUpdate()
      .first();
  }

  /**
   * Called inside the group-add transaction, before the membership row is written. A pilgrim who
   * already holds a FREE activation (left a group before visa/ticket work) costs nothing; anyone
   * else takes one coin, or the whole add fails with 402.
   */
  async activateForGroup(
    trx: Knex.Transaction,
    agencyId: string,
    pilgrimId: string,
    groupId: string,
    userId?: string | null,
  ): Promise<{ charged: number; activation_id: string }> {
    const live = await this.findLive(trx, agencyId, pilgrimId);
    if (live?.status === 'REFUND_PENDING') {
      throw new BadRequestException({ message: 'A refund request for this pilgrim is pending', code: 'REFUND_PENDING' });
    }
    if (live) {
      await trx(A).where({ id: live.id }).update({ status: 'IN_USE', group_id: groupId, updated_at: new Date() });
      return { charged: 0, activation_id: live.id };
    }
    const tx = await this.move(trx, agencyId, -COINS_PER_ACTIVATION, {
      type: 'ACTIVATION',
      pilgrim_count: 1,
      group_id: groupId,
      created_by_id: userId ?? null,
    });
    const [row] = await trx(A)
      .insert({
        agency_id: agencyId,
        pilgrim_id: pilgrimId,
        status: 'IN_USE',
        coins: COINS_PER_ACTIVATION,
        group_id: groupId,
        transaction_id: tx.id,
      })
      .returning('id');
    return { charged: COINS_PER_ACTIVATION, activation_id: row.id };
  }

  /** IN_TRIP / TRIP_ENDED etc. for one group, read from the same rules the lists use. */
  private async groupStatus(trx: Knex.Transaction, groupId: string): Promise<string | undefined> {
    const row: { status?: string } | undefined = await trx(`${TABLE_NAMES.GROUPS} as g`)
      .where('g.id', groupId)
      .first(trx.raw(`${effectiveStatusSql('g')} as status`)) as any;
    return row?.status;
  }

  /**
   * What the activation becomes when the pilgrim leaves the group: FREE (usable for the next
   * group) if no visa/ticket work was started and the trip hasn't begun, CONSUMED otherwise.
   * Call it before the membership row is deleted.
   */
  async releaseMember(trx: Knex.Transaction, groupId: string, pilgrimId: string): Promise<ActivationStatus | null> {
    const member = await trx(TABLE_NAMES.GROUP_MEMBERS).where({ group_id: groupId, pilgrim_id: pilgrimId }).first('visa_status', 'ticket_status');
    if (!member) return null;
    const live = await trx(A).where({ pilgrim_id: pilgrimId, group_id: groupId, status: 'IN_USE' }).forUpdate().first();
    if (!live) return null;
    const status = await this.groupStatus(trx, groupId);
    const started = status === 'IN_TRIP' || status === 'TRIP_ENDED';
    const hadDocs = member.visa_status !== 'NONE' || member.ticket_status !== 'NONE';
    const next: ActivationStatus = started || hadDocs ? 'CONSUMED' : 'FREE';
    await trx(A).where({ id: live.id }).update({
      status: next,
      updated_at: new Date(),
      consumed_at: next === 'CONSUMED' ? new Date() : null,
    });
    return next;
  }

  /** releaseMember for every member of a group that is being deleted. */
  async releaseGroup(trx: Knex.Transaction, groupId: string): Promise<void> {
    const members = await trx(TABLE_NAMES.GROUP_MEMBERS).where({ group_id: groupId }).pluck('pilgrim_id');
    for (const pilgrimId of members) await this.releaseMember(trx, groupId, pilgrimId);
  }

  /** Visa/ticket edits are only for activated members (current ones were migrated as activated). */
  async assertMembersActivated(groupId: string, pilgrimIds: string[]): Promise<void> {
    if (pilgrimIds.length === 0) return;
    const ok = await this.db(A).where({ group_id: groupId, status: 'IN_USE' }).whereIn('pilgrim_id', pilgrimIds).pluck('pilgrim_id');
    const missing = pilgrimIds.filter((id) => !ok.includes(id));
    if (missing.length) {
      throw new HttpException(
        { message: 'Pilgrim is not activated for this group', code: 'PILGRIM_NOT_ACTIVATED', pilgrim_ids: missing },
        HttpStatus.FORBIDDEN,
      );
    }
  }

  // ── Wallet views ───────────────────────────────────────────

  async wallet(agencyId: string) {
    const row = await this.db(`${AG} as a`)
      .leftJoin(`${TABLE_NAMES.BILLING_CURRENCIES} as c`, 'c.code', 'a.currency_code')
      .where('a.id', agencyId)
      .first('a.id as agency_id', 'a.coin_balance', 'a.currency_code', 'c.name as currency_name', 'c.symbol as currency_symbol', 'c.coin_price');
    if (!row) throw new NotFoundException('Agency not found');
    const price = Number(row.coin_price ?? 0);
    const stats: { used_coins?: number; in_use?: number; free?: number } | undefined = await this.db(A)
      .where({ agency_id: agencyId })
      .first(
        this.db.raw(`COUNT(*) FILTER (WHERE coins > 0 AND status <> 'REFUNDED')::int as used_coins`),
        this.db.raw(`COUNT(*) FILTER (WHERE status = 'IN_USE')::int as in_use`),
        this.db.raw(`COUNT(*) FILTER (WHERE status = 'FREE')::int as free`),
      ) as any;
    const bought = await this.db(T).where({ agency_id: agencyId, type: 'TOPUP' }).sum({ s: 'coins' }).first();
    return {
      agency_id: row.agency_id,
      coins: row.coin_balance,
      currency: { code: row.currency_code, name: row.currency_name, symbol: row.currency_symbol, coin_price: price },
      value: Math.round(row.coin_balance * price * 100) / 100,
      bought_coins: Number(bought?.s ?? 0),
      used_coins: stats?.used_coins ?? 0,
      in_use: stats?.in_use ?? 0,
      free: stats?.free ?? 0,
    };
  }

  async transactions(agencyId: string, pageIndex = 1, pageSize = 20, type?: string) {
    const base = this.db(`${T} as t`).where('t.agency_id', agencyId);
    if (type) base.where('t.type', type);
    const [{ count }] = await base.clone().count('* as count');
    const items = await base
      .clone()
      .leftJoin(`${TABLE_NAMES.GROUPS} as g`, 'g.id', 't.group_id')
      .leftJoin(`${TABLE_NAMES.USERS} as u`, 'u.id', 't.created_by_id')
      .select('t.*', 'g.name as group_name', 'u.username as created_by_name')
      .orderBy('t.created_at', 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);
    return this.page(items, Number(count), pageIndex, pageSize);
  }

  page<T>(items: T[], total: number, pageIndex: number, pageSize: number): PaginatedResult<T> {
    return new PaginatedResult(items, this.meta(total, pageIndex, pageSize));
  }

  meta(total: number, pageIndex: number, pageSize: number) {
    return { total_items_count: total, total_pages_count: Math.ceil(total / pageSize) || 1, page_size: pageSize, page_index: pageIndex };
  }
}
