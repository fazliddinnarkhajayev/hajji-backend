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
}

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
      )
      .orderBy(`${TABLE_NAMES.GROUP_MEMBERS}.joined_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    return { records: records as any[], total: Number(count) };
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
