import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';

export interface RoomGroup {
  id: string;
  group_id: string;
  name: string;
  created_at: Date;
  created_by_id?: string | null;
}

export interface RoomGroupMember {
  id: string;
  room_group_id: string;
  pilgrim_id: string;
  full_name: string;
  phone: string | null;
  created_at: Date;
}

export interface RoomGroupWithMembers extends RoomGroup {
  members: RoomGroupMember[];
}

@Injectable()
export class RoomGroupsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async create(groupId: string, name: string, createdById?: string, trx?: Knex.Transaction): Promise<RoomGroup> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_GROUPS) : this.db(TABLE_NAMES.ROOM_GROUPS);
    const [record] = await qb
      .insert({ group_id: groupId, name, created_by_id: createdById ?? null })
      .returning('*');
    return record as RoomGroup;
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<RoomGroup | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_GROUPS) : this.db(TABLE_NAMES.ROOM_GROUPS);
    const record = await qb.where({ id }).first();
    return record as RoomGroup | undefined;
  }

  async findByGroupId(groupId: string): Promise<RoomGroupWithMembers[]> {
    const roomGroups = await this.db(TABLE_NAMES.ROOM_GROUPS)
      .where({ group_id: groupId })
      .orderBy('created_at', 'asc') as RoomGroup[];

    if (roomGroups.length === 0) return [];

    const roomGroupIds = roomGroups.map((rg) => rg.id);

    const members = await this.db(TABLE_NAMES.ROOM_GROUP_MEMBERS)
      .join(
        TABLE_NAMES.PILGRIMS,
        `${TABLE_NAMES.ROOM_GROUP_MEMBERS}.pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .whereIn(`${TABLE_NAMES.ROOM_GROUP_MEMBERS}.room_group_id`, roomGroupIds)
      .select(
        `${TABLE_NAMES.ROOM_GROUP_MEMBERS}.*`,
        this.db.raw(
          `concat_ws(' ', ${TABLE_NAMES.PILGRIMS}.first_name, ${TABLE_NAMES.PILGRIMS}.middle_name, ${TABLE_NAMES.PILGRIMS}.last_name) as full_name`,
        ),
        `${TABLE_NAMES.PILGRIMS}.phone`,
      );

    return roomGroups.map((rg) => ({
      ...rg,
      members: members.filter((m: any) => m.room_group_id === rg.id) as RoomGroupMember[],
    }));
  }

  async updateName(id: string, name: string, trx?: Knex.Transaction): Promise<RoomGroup | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_GROUPS) : this.db(TABLE_NAMES.ROOM_GROUPS);
    const [record] = await qb.where({ id }).update({ name }).returning('*');
    return record as RoomGroup | undefined;
  }

  async delete(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_GROUPS) : this.db(TABLE_NAMES.ROOM_GROUPS);
    await qb.where({ id }).delete();
  }

  async addMember(roomGroupId: string, pilgrimId: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_GROUP_MEMBERS) : this.db(TABLE_NAMES.ROOM_GROUP_MEMBERS);
    await qb.insert({ room_group_id: roomGroupId, pilgrim_id: pilgrimId });
  }

  async removeMember(pilgrimId: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_GROUP_MEMBERS) : this.db(TABLE_NAMES.ROOM_GROUP_MEMBERS);
    await qb.where({ pilgrim_id: pilgrimId }).delete();
  }

  async findMemberByPilgrimId(pilgrimId: string, trx?: Knex.Transaction): Promise<RoomGroupMember | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_GROUP_MEMBERS) : this.db(TABLE_NAMES.ROOM_GROUP_MEMBERS);
    const record = await qb.where({ pilgrim_id: pilgrimId }).first();
    return record as RoomGroupMember | undefined;
  }
}
