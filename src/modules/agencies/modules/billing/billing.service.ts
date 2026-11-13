import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BillingService } from 'src/shared/services/billing.service';
import { refundRequestSelect } from 'src/modules/admins/modules/billing/billing.service';
import { ActivationsQueryDto, AgencyRefundRequestsQueryDto, CreateRefundRequestDto } from './billing.dto';

const A = TABLE_NAMES.PILGRIM_ACTIVATIONS;
const R = TABLE_NAMES.REFUND_REQUESTS;

/** Agency side of coin billing: own wallet, history, activations and refund requests. */
@Injectable()
export class AgencyBillingService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
    private readonly billing: BillingService,
  ) {}

  wallet(agencyId: string) {
    return this.billing.wallet(agencyId);
  }

  transactions(agencyId: string, pageIndex = 1, pageSize = 20, type?: string) {
    return this.billing.transactions(agencyId, pageIndex, pageSize, type);
  }

  async activations(agencyId: string, q: ActivationsQueryDto) {
    const pageIndex = q.page_index ?? 1;
    const pageSize = q.page_size ?? 20;
    const base = this.db(`${A} as pa`)
      .leftJoin(`${TABLE_NAMES.PILGRIMS} as p`, 'p.id', 'pa.pilgrim_id')
      .where('pa.agency_id', agencyId);
    if (q.status) base.where('pa.status', q.status);
    if (q.refundable === 'true') base.whereIn('pa.status', ['IN_USE', 'FREE']).where('pa.coins', '>', 0);
    const text = q.q?.trim();
    if (text) {
      const like = `%${text.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
      base.where((b) => b.whereRaw(`concat_ws(' ', p.last_name, p.first_name, p.middle_name) ILIKE ?`, [like]).orWhere('p.passport_number', 'ilike', like));
    }
    const [{ count }] = await base.clone().count('* as count');
    const items = await base
      .clone()
      .leftJoin(`${TABLE_NAMES.GROUPS} as g`, 'g.id', 'pa.group_id')
      .select(
        'pa.id', 'pa.pilgrim_id', 'pa.status', 'pa.coins', 'pa.group_id', 'g.name as group_name', 'pa.created_at', 'pa.consumed_at',
        'p.passport_number', this.db.raw(`NULLIF(TRIM(CONCAT_WS(' ', p.last_name, p.first_name, p.middle_name)), '') as pilgrim_name`),
      )
      .orderBy('pa.created_at', 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);
    return this.billing.page(items, Number(count), pageIndex, pageSize);
  }

  async refundRequests(agencyId: string, q: AgencyRefundRequestsQueryDto) {
    const pageIndex = q.page_index ?? 1;
    const pageSize = q.page_size ?? 20;
    const base = this.db(`${R} as r`).where('r.agency_id', agencyId);
    if (q.status) base.where('r.status', q.status);
    const [{ count }] = await base.clone().count('* as count');
    const items = await refundRequestSelect(this.db, base.clone())
      .orderBy('r.created_at', 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);
    return this.billing.page(items, Number(count), pageIndex, pageSize);
  }

  /**
   * Asks for the activation's coin back. A pilgrim still in a group is taken out of it first
   * (with their room places); the activation waits as REFUND_PENDING until an admin decides.
   */
  async createRefundRequest(agencyId: string, dto: CreateRefundRequestDto, userId?: string) {
    const id = await this.db.transaction(async (trx) => {
      const activation = await trx(A).where({ id: dto.activation_id, agency_id: agencyId }).forUpdate().first();
      if (!activation) throw new NotFoundException('Activation not found');
      if (activation.coins <= 0) throw new BadRequestException('This activation was free, nothing to refund');
      if (activation.status !== 'IN_USE' && activation.status !== 'FREE') {
        throw new BadRequestException('Only an activation in use or unused can be refunded');
      }

      let previous = activation.status as string;
      let hadDocuments = false;
      if (activation.status === 'IN_USE' && activation.group_id) {
        const member = await trx(TABLE_NAMES.GROUP_MEMBERS)
          .where({ group_id: activation.group_id, pilgrim_id: activation.pilgrim_id })
          .first('visa_status', 'ticket_status');
        if (member) {
          hadDocuments = member.visa_status !== 'NONE' || member.ticket_status !== 'NONE';
          previous = (await this.billing.releaseMember(trx, activation.group_id, activation.pilgrim_id)) ?? 'FREE';
          await trx(TABLE_NAMES.ROOM_MEMBERS).where({ pilgrim_id: activation.pilgrim_id }).delete();
          await trx(TABLE_NAMES.ROOM_REQUEST_MEMBERS).where({ pilgrim_id: activation.pilgrim_id }).delete();
          await trx(TABLE_NAMES.GROUP_MEMBERS).where({ pilgrim_id: activation.pilgrim_id }).delete();
        } else {
          previous = 'FREE';
        }
      }

      await trx(A).where({ id: activation.id }).update({ status: 'REFUND_PENDING', updated_at: new Date() });
      const [row] = await trx(R)
        .insert({
          agency_id: agencyId,
          activation_id: activation.id,
          reason: dto.reason,
          comment: dto.comment ?? null,
          previous_status: previous,
          had_documents: hadDocuments,
          created_by_id: userId ?? null,
        })
        .returning('id');
      return row.id as string;
    });
    return refundRequestSelect(this.db, this.db(`${R} as r`).where('r.id', id)).first();
  }
}
