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
    // Just return group members - frontend can fetch pilgrim details separately
    const records = await this.qb(trx)
      .where({ group_id: groupId })
      .orderBy('joined_at', 'desc');

    return records as any[];
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
