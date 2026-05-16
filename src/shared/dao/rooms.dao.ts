import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';

export interface Room {
  id: string;
  group_id: string;
  name: string;
  capacity: number;
  created_at: Date;
  created_by_id?: string | null;
}

export interface RoomMember {
  id: string;
  room_id: string;
  pilgrim_id: string;
  full_name: string;
  phone: string | null;
  created_at: Date;
}

export interface RoomWithMembers extends Room {
  members: RoomMember[];
}

export interface RoomInput {
  name: string;
  capacity: number;
}

@Injectable()
export class RoomsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async createBulk(
    groupId: string,
    rooms: RoomInput[],
    createdById?: string,
    trx?: Knex.Transaction,
  ): Promise<Room[]> {
    const rows = rooms.map(({ name, capacity }) => ({
      group_id: groupId,
      name: name.trim(),
      capacity,
      created_by_id: createdById ?? null,
    }));

    const qb = trx ? trx(TABLE_NAMES.ROOMS) : this.db(TABLE_NAMES.ROOMS);
    const records = await qb.insert(rows).returning('*');
    return records as Room[];
  }

  async findByGroupId(groupId: string): Promise<RoomWithMembers[]> {
    const rooms = await this.db(TABLE_NAMES.ROOMS)
      .where({ group_id: groupId })
      .orderBy('created_at', 'asc') as Room[];

    if (rooms.length === 0) return [];

    const roomIds = rooms.map((r) => r.id);

    const members = await this.db(TABLE_NAMES.ROOM_MEMBERS)
      .join(TABLE_NAMES.PILGRIMS, `${TABLE_NAMES.ROOM_MEMBERS}.pilgrim_id`, `${TABLE_NAMES.PILGRIMS}.id`)
      .whereIn(`${TABLE_NAMES.ROOM_MEMBERS}.room_id`, roomIds)
      .select(
        `${TABLE_NAMES.ROOM_MEMBERS}.*`,
        this.db.raw(
          `concat_ws(' ', ${TABLE_NAMES.PILGRIMS}.first_name, ${TABLE_NAMES.PILGRIMS}.middle_name, ${TABLE_NAMES.PILGRIMS}.last_name) as full_name`,
        ),
        `${TABLE_NAMES.PILGRIMS}.phone`,
      );

    return rooms.map((r) => ({
      ...r,
      members: members.filter((m: any) => m.room_id === r.id) as RoomMember[],
    }));
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<Room | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOMS) : this.db(TABLE_NAMES.ROOMS);
    return (await qb.where({ id }).first()) as Room | undefined;
  }

  async delete(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOMS) : this.db(TABLE_NAMES.ROOMS);
    await qb.where({ id }).delete();
  }

  async addMember(roomId: string, pilgrimId: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_MEMBERS) : this.db(TABLE_NAMES.ROOM_MEMBERS);
    await qb.insert({ room_id: roomId, pilgrim_id: pilgrimId });
  }

  async removeMember(pilgrimId: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_MEMBERS) : this.db(TABLE_NAMES.ROOM_MEMBERS);
    await qb.where({ pilgrim_id: pilgrimId }).delete();
  }

  async findMemberByPilgrimId(pilgrimId: string, trx?: Knex.Transaction): Promise<RoomMember | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_MEMBERS) : this.db(TABLE_NAMES.ROOM_MEMBERS);
    return (await qb.where({ pilgrim_id: pilgrimId }).first()) as RoomMember | undefined;
  }

  async countMembers(roomId: string, trx?: Knex.Transaction): Promise<number> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_MEMBERS) : this.db(TABLE_NAMES.ROOM_MEMBERS);
    const result = await qb.where({ room_id: roomId }).count('id as count').first();
    return Number((result as any)?.count ?? 0);
  }
}
