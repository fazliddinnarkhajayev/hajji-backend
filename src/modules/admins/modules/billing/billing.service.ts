import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BillingService } from 'src/shared/services/billing.service';
import {
  AdjustDto, CreateCurrencyDto, DecideRefundDto, RefundRequestsQueryDto, TopupDto, UpdateCurrencyDto,
} from './dto/billing.dto';

const C = TABLE_NAMES.BILLING_CURRENCIES;
const AG = TABLE_NAMES.AGENCIES;
const R = TABLE_NAMES.REFUND_REQUESTS;
const A = TABLE_NAMES.PILGRIM_ACTIVATIONS;

/** Admin side of coin billing: prices, agency currency, top-ups and refund decisions. */
@Injectable()
export class AdminBillingService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
    private readonly billing: BillingService,
  ) {}

  // ── Currencies ─────────────────────────────────────────────

  async currencies() {
    const rows = await this.db(`${C} as c`)
      .select('c.*', this.db.raw(`(SELECT COUNT(*)::int FROM ${AG} a WHERE a.currency_code = c.code AND a.is_deleted = false) as agencies_count`))
      .orderBy([{ column: 'c.is_active', order: 'desc' }, { column: 'c.code' }]);
    return rows.map((r) => ({ ...r, coin_price: Number(r.coin_price) }));
  }

  async createCurrency(dto: CreateCurrencyDto, userId?: string) {
    const exists = await this.db(C).where({ code: dto.code }).first();
    if (exists) throw new ConflictException('Currency already exists');
    const [row] = await this.db(C).insert({ ...dto, updated_by_id: userId ?? null }).returning('*');
    return { ...row, coin_price: Number(row.coin_price) };
  }

  async updateCurrency(code: string, dto: UpdateCurrencyDto, userId?: string) {
    if (dto.is_active === false) {
      const used = await this.db(AG).where({ currency_code: code, is_deleted: false }).first('id');
      if (used) throw new BadRequestException('Agencies still use this currency');
    }
    const [row] = await this.db(C).where({ code }).update({ ...dto, updated_at: new Date(), updated_by_id: userId ?? null }).returning('*');
    if (!row) throw new NotFoundException('Currency not found');
    return { ...row, coin_price: Number(row.coin_price) };
  }

  // ── Agency wallets ─────────────────────────────────────────

  /** Every agency with its balance, for the admin "Coin" page. */
  async agencies() {
    const rows = await this.db(`${AG} as a`)
      .leftJoin(`${C} as c`, 'c.code', 'a.currency_code')
      .where('a.is_deleted', false)
      .whereNull('a.deleted_at')
      .select('a.id', 'a.name', 'a.status', 'a.coin_balance', 'a.currency_code', 'c.symbol as currency_symbol', 'c.coin_price')
      .orderBy('a.name');
    return rows.map((r) => ({ ...r, coin_price: Number(r.coin_price) }));
  }

  private async agency(trx: Knex | Knex.Transaction, id: string) {
    const row = await trx(`${AG} as a`)
      .leftJoin(`${C} as c`, 'c.code', 'a.currency_code')
      .where({ 'a.id': id, 'a.is_deleted': false })
      .first('a.id', 'a.currency_code', 'c.coin_price');
    if (!row) throw new NotFoundException('Agency not found');
    return row;
  }

  wallet(agencyId: string) {
    return this.billing.wallet(agencyId);
  }

  async transactions(agencyId: string, pageIndex = 1, pageSize = 20, type?: string) {
    await this.agency(this.db, agencyId);
    return this.billing.transactions(agencyId, pageIndex, pageSize, type);
  }

  async setCurrency(agencyId: string, code: string) {
    await this.agency(this.db, agencyId);
    const currency = await this.db(C).where({ code, is_active: true }).first();
    if (!currency) throw new BadRequestException('Unknown or inactive currency');
    await this.db(AG).where({ id: agencyId }).update({ currency_code: code, updated_at: new Date() });
    return this.billing.wallet(agencyId);
  }

  async topup(agencyId: string, dto: TopupDto, userId?: string) {
    await this.db.transaction(async (trx) => {
      const agency = await this.agency(trx, agencyId);
      const price = Number(agency.coin_price);
      await this.billing.move(trx, agencyId, dto.coins, {
        type: 'TOPUP',
        currency_code: agency.currency_code,
        coin_price: price,
        paid_amount: dto.paid_amount ?? Math.round(dto.coins * price * 100) / 100,
        reference: dto.reference ?? null,
        note: dto.note ?? null,
        created_by_id: userId ?? null,
      });
    });
    return this.billing.wallet(agencyId);
  }

  async adjust(agencyId: string, dto: AdjustDto, userId?: string) {
    await this.db.transaction(async (trx) => {
      await this.agency(trx, agencyId);
      await this.billing.move(trx, agencyId, dto.coins, { type: 'ADJUSTMENT', note: dto.note, created_by_id: userId ?? null });
    });
    return this.billing.wallet(agencyId);
  }

  // ── Refund requests ────────────────────────────────────────

  async refundRequests(q: RefundRequestsQueryDto) {
    const pageIndex = q.page_index ?? 1;
    const pageSize = q.page_size ?? 20;
    const base = this.db(`${R} as r`);
    if (q.status) base.where('r.status', q.status);
    if (q.agency_id) base.where('r.agency_id', q.agency_id);
    const [{ count }] = await base.clone().count('* as count');
    const items = await refundRequestSelect(this.db, base.clone())
      .orderByRaw(`(r.status = 'PENDING') DESC, r.created_at DESC`)
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);
    return this.billing.page(items, Number(count), pageIndex, pageSize);
  }

  /** For the badge on the "Qaytarish arizalari" tab. */
  async pendingCount() {
    const [{ pending }] = await this.db(R).where({ status: 'PENDING' }).count('* as pending');
    return { pending: Number(pending) };
  }

  private async pendingRequest(trx: Knex.Transaction, id: string) {
    const req = await trx(R).where({ id }).forUpdate().first();
    if (!req) throw new NotFoundException('Refund request not found');
    if (req.status !== 'PENDING') throw new BadRequestException('Refund request is already decided');
    const activation = await trx(A).where({ id: req.activation_id }).forUpdate().first();
    if (!activation) throw new NotFoundException('Activation not found');
    return { req, activation };
  }

  /** Gives the coin back and closes the activation. */
  async approve(id: string, dto: DecideRefundDto, userId?: string) {
    await this.db.transaction(async (trx) => {
      const { req, activation } = await this.pendingRequest(trx, id);
      const tx = await this.billing.move(trx, req.agency_id, activation.coins, {
        type: 'REFUND',
        pilgrim_count: 1,
        group_id: activation.group_id,
        note: `Ariza #${req.number}`,
        created_by_id: userId ?? null,
      });
      await trx(A).where({ id: activation.id }).update({ status: 'REFUNDED', updated_at: new Date() });
      await trx(R).where({ id }).update({
        status: 'APPROVED', admin_comment: dto.admin_comment ?? null, decided_by_id: userId ?? null, decided_at: new Date(), transaction_id: tx.id,
      });
    });
    return this.one(id);
  }

  /** No coin back: the activation returns to what it was when the request was sent. */
  async reject(id: string, dto: DecideRefundDto, userId?: string) {
    await this.db.transaction(async (trx) => {
      const { req, activation } = await this.pendingRequest(trx, id);
      const restored = req.previous_status;
      await trx(A).where({ id: activation.id }).update({
        status: restored, updated_at: new Date(), consumed_at: restored === 'CONSUMED' ? new Date() : null,
      });
      await trx(R).where({ id }).update({
        status: 'REJECTED', admin_comment: dto.admin_comment ?? null, decided_by_id: userId ?? null, decided_at: new Date(),
      });
    });
    return this.one(id);
  }

  private async one(id: string) {
    return refundRequestSelect(this.db, this.db(`${R} as r`).where('r.id', id)).first();
  }
}

/** Refund request rows with agency, pilgrim and group names (shared with the agency side). */
export function refundRequestSelect(db: Knex, q: Knex.QueryBuilder) {
  return q
    .join(`${A} as pa`, 'pa.id', 'r.activation_id')
    .join(`${AG} as ag`, 'ag.id', 'r.agency_id')
    .leftJoin(`${TABLE_NAMES.PILGRIMS} as p`, 'p.id', 'pa.pilgrim_id')
    .leftJoin(`${TABLE_NAMES.GROUPS} as g`, 'g.id', 'pa.group_id')
    .leftJoin(`${TABLE_NAMES.USERS} as du`, 'du.id', 'r.decided_by_id')
    .select(
      'r.id', 'r.number', 'r.agency_id', 'ag.name as agency_name', 'r.activation_id', 'r.reason', 'r.comment', 'r.status',
      'r.previous_status', 'r.had_documents', 'r.admin_comment', 'r.created_at', 'r.decided_at', 'du.username as decided_by_name',
      'pa.coins', 'pa.pilgrim_id', 'pa.group_id', 'g.name as group_name', 'p.passport_number',
      db.raw(`NULLIF(TRIM(CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name)), '') as pilgrim_name`),
    );
}
