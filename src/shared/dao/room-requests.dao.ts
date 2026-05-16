import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';

export interface RoomRequest {
  id: string;
  group_id: string;
  name: string;
  created_at: Date;
  created_by_id?: string | null;
}

export interface RoomRequestMember {
  id: string;
  room_request_id: string;
  pilgrim_id: string;
  full_name: string;
  phone: string | null;
  created_at: Date;
}

export interface RoomRequestWithMembers extends RoomRequest {
  members: RoomRequestMember[];
}

@Injectable()
export class RoomRequestsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async create(groupId: string, name: string, createdById?: string, trx?: Knex.Transaction): Promise<RoomRequest> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_REQUESTS) : this.db(TABLE_NAMES.ROOM_REQUESTS);
    const [record] = await qb
      .insert({ group_id: groupId, name, created_by_id: createdById ?? null })
      .returning('*');
    return record as RoomRequest;
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<RoomRequest | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_REQUESTS) : this.db(TABLE_NAMES.ROOM_REQUESTS);
    const record = await qb.where({ id }).first();
    return record as RoomRequest | undefined;
  }

  async findByGroupId(groupId: string): Promise<RoomRequestWithMembers[]> {
    const roomRequests = await this.db(TABLE_NAMES.ROOM_REQUESTS)
      .where({ group_id: groupId })
      .orderBy('created_at', 'asc') as RoomRequest[];

    if (roomRequests.length === 0) return [];

    const roomRequestIds = roomRequests.map((rr) => rr.id);

    const members = await this.db(TABLE_NAMES.ROOM_REQUEST_MEMBERS)
      .join(
        TABLE_NAMES.PILGRIMS,
        `${TABLE_NAMES.ROOM_REQUEST_MEMBERS}.pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .whereIn(`${TABLE_NAMES.ROOM_REQUEST_MEMBERS}.room_request_id`, roomRequestIds)
      .select(
        `${TABLE_NAMES.ROOM_REQUEST_MEMBERS}.*`,
        this.db.raw(
          `concat_ws(' ', ${TABLE_NAMES.PILGRIMS}.first_name, ${TABLE_NAMES.PILGRIMS}.middle_name, ${TABLE_NAMES.PILGRIMS}.last_name) as full_name`,
        ),
        `${TABLE_NAMES.PILGRIMS}.phone`,
      );

    return roomRequests.map((rr) => ({
      ...rr,
      members: members.filter((m: any) => m.room_request_id === rr.id) as RoomRequestMember[],
    }));
  }

  async updateName(id: string, name: string, trx?: Knex.Transaction): Promise<RoomRequest | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_REQUESTS) : this.db(TABLE_NAMES.ROOM_REQUESTS);
    const [record] = await qb.where({ id }).update({ name }).returning('*');
    return record as RoomRequest | undefined;
  }

  async delete(id: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_REQUESTS) : this.db(TABLE_NAMES.ROOM_REQUESTS);
    await qb.where({ id }).delete();
  }

  async addMember(roomRequestId: string, pilgrimId: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_REQUEST_MEMBERS) : this.db(TABLE_NAMES.ROOM_REQUEST_MEMBERS);
    await qb.insert({ room_request_id: roomRequestId, pilgrim_id: pilgrimId });
  }

  async removeMember(pilgrimId: string, trx?: Knex.Transaction): Promise<void> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_REQUEST_MEMBERS) : this.db(TABLE_NAMES.ROOM_REQUEST_MEMBERS);
    await qb.where({ pilgrim_id: pilgrimId }).delete();
  }

  async findMemberByPilgrimId(pilgrimId: string, trx?: Knex.Transaction): Promise<RoomRequestMember | undefined> {
    const qb = trx ? trx(TABLE_NAMES.ROOM_REQUEST_MEMBERS) : this.db(TABLE_NAMES.ROOM_REQUEST_MEMBERS);
    const record = await qb.where({ pilgrim_id: pilgrimId }).first();
    return record as RoomRequestMember | undefined;
  }
}
