import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';

export interface GroupMember {
  id: string;
  group_id: string;
  pilgrim_id: string;
  joined_at: Date;
  created_at: Date;
  visa_status?: string;
  visa_number?: string | null;
  visa_issued_at?: Date | string | null;
  visa_expires_at?: Date | string | null;
  ticket_status?: string;
  ticket_number?: string | null;
  flight_number?: string | null;
  flight_date?: Date | string | null;
  pnr?: string | null;
  documents_note?: string | null;
  documents_updated_at?: Date | null;
  documents_updated_by_id?: string | null;
}

/** Membership columns that hold the visa / ticket state. */
export const MEMBER_DOCUMENT_COLUMNS = [
  'visa_status', 'visa_number', 'visa_issued_at', 'visa_expires_at',
  'ticket_status', 'ticket_number', 'flight_number', 'flight_date', 'pnr',
  'documents_note', 'documents_updated_at',
] as const;

/** Pilgrim columns needed for visa / ticket paperwork. */
export const PILGRIM_PASSPORT_COLUMNS = [
  'first_name', 'last_name', 'middle_name', 'birth_date', 'gender', 'citizenship',
  'passport_number', 'passport_issued_at', 'passport_expires_at', 'pinfl', 'phone',
] as const;

@Injectable()
export class GroupMembersDao extends BaseDao<GroupMember> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.GROUP_MEMBERS, db);
  }

  async findByGroupId(groupId: string, trx?: Knex.Transaction): Promise<GroupMember[]> {
    const records = await this.qb(trx).where({ group_id: groupId }).orderBy('joined_at', 'desc');
    return records as GroupMember[];
  }

  async findByPilgrimId(pilgrimId: string, trx?: Knex.Transaction): Promise<GroupMember | undefined> {
    const record = await this.qb(trx).where({ pilgrim_id: pilgrimId }).first();
    return record as GroupMember | undefined;
  }

  async addPilgrimToGroup(
    groupId: string,
    pilgrimId: string,
    trx?: Knex.Transaction,
  ): Promise<GroupMember> {
    const [record] = await this.qb(trx)
      .insert({
        group_id: groupId,
        pilgrim_id: pilgrimId,
      })
      .returning('*');
    return record as GroupMember;
  }

  /**
   * Frees every pilgrim of a group that is being deleted: its memberships, room and room-request
   * places. Groups are soft-deleted, so the FK cascades never fire, and these rows are unique per
   * pilgrim: left behind, they keep the pilgrims out of every other group.
   */
  async releaseGroup(groupId: string, trx?: Knex.Transaction): Promise<void> {
    const q = (table: string) => (trx ? trx(table) : this.db(table));
    await q(TABLE_NAMES.ROOM_MEMBERS)
      .whereIn('room_id', q(TABLE_NAMES.ROOMS).select('id').where({ group_id: groupId }))
      .delete();
    await q(TABLE_NAMES.ROOM_REQUEST_MEMBERS)
      .whereIn('room_request_id', q(TABLE_NAMES.ROOM_REQUESTS).select('id').where({ group_id: groupId }))
      .delete();
    await this.qb(trx).where({ group_id: groupId }).delete();
  }

  async removePilgrimFromGroup(pilgrimId: string, trx?: Knex.Transaction): Promise<boolean> {
    const affected = await this.qb(trx).where({ pilgrim_id: pilgrimId }).delete();
    return affected > 0;
  }

  async getGroupMembersWithDetails(
    groupId: string,
    trx?: Knex.Transaction,
  ): Promise<any[]> {
    const records = await this.qb(trx)
      .where({ group_id: groupId })
      .orderBy('joined_at', 'desc');
    return records as any[];
  }

  async getGroupMembersWithDetailsPaginated(
    groupId: string,
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ): Promise<{ records: any[]; total: number }> {
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .where({ group_id: groupId })
      .count('* as count');

    const records = await this.qb(trx)
      .leftJoin(
        TABLE_NAMES.PILGRIMS,
        `${TABLE_NAMES.GROUP_MEMBERS}.pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .where({ [`${TABLE_NAMES.GROUP_MEMBERS}.group_id`]: groupId })
      .select(
        `${TABLE_NAMES.GROUP_MEMBERS}.id`,
        `${TABLE_NAMES.GROUP_MEMBERS}.group_id`,
        `${TABLE_NAMES.GROUP_MEMBERS}.pilgrim_id`,
        `${TABLE_NAMES.GROUP_MEMBERS}.joined_at`,
        `${TABLE_NAMES.GROUP_MEMBERS}.created_at`,
        this.db.raw(
          `TRIM(CONCAT_WS(' ', ${TABLE_NAMES.PILGRIMS}.first_name, NULLIF(${TABLE_NAMES.PILGRIMS}.middle_name, ''), ${TABLE_NAMES.PILGRIMS}.last_name)) as full_name`,
        ),
        `${TABLE_NAMES.PILGRIMS}.phone`,
        `${TABLE_NAMES.PILGRIMS}.email`,
        `${TABLE_NAMES.PILGRIMS}.agency_id`,
        ...MEMBER_DOCUMENT_COLUMNS.map((c) => `${TABLE_NAMES.GROUP_MEMBERS}.${c}`),
        ...PILGRIM_PASSPORT_COLUMNS.filter((c) => c !== 'phone').map((c) => `${TABLE_NAMES.PILGRIMS}.${c}`),
        this.db.raw(`(${TABLE_NAMES.PILGRIMS}.passport_photo_path IS NOT NULL) as has_passport_photo`),
      )
      .orderBy(`${TABLE_NAMES.GROUP_MEMBERS}.joined_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    return { records: records as any[], total: Number(count) };
  }

  /** Every member with passport + visa/ticket data, in name order (for the Excel exports). */
  async findForExport(groupId: string, trx?: Knex.Transaction): Promise<any[]> {
    return this.qb(trx)
      .join(TABLE_NAMES.PILGRIMS, `${TABLE_NAMES.GROUP_MEMBERS}.pilgrim_id`, `${TABLE_NAMES.PILGRIMS}.id`)
      .where(`${TABLE_NAMES.GROUP_MEMBERS}.group_id`, groupId)
      .select(
        `${TABLE_NAMES.GROUP_MEMBERS}.pilgrim_id`,
        ...MEMBER_DOCUMENT_COLUMNS.map((c) => `${TABLE_NAMES.GROUP_MEMBERS}.${c}`),
        ...PILGRIM_PASSPORT_COLUMNS.map((c) => `${TABLE_NAMES.PILGRIMS}.${c}`),
      )
      .orderBy([`${TABLE_NAMES.PILGRIMS}.last_name`, `${TABLE_NAMES.PILGRIMS}.first_name`]);
  }

  /** Writes visa / ticket fields for the given members of one group; returns how many rows changed. */
  async updateDocuments(
    groupId: string,
    pilgrimIds: string[],
    patch: Partial<GroupMember>,
    trx?: Knex.Transaction,
  ): Promise<number> {
    return this.qb(trx).where({ group_id: groupId }).whereIn('pilgrim_id', pilgrimIds).update(patch);
  }

  async checkPilgrimExistsInGroup(
    groupId: string,
    pilgrimId: string,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const record = await this.qb(trx)
      .where({ group_id: groupId, pilgrim_id: pilgrimId })
      .first();
    return !!record;
  }
}
