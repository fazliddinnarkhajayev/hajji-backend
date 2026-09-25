import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface ChatRoomMember {
  room_id: string;
  user_id: string;
  first_name: string;
  last_name: string | null;
}

export interface ChatRoomRow {
  id: string;
  agency_id: string;
  type: 'dm' | 'group';
  name: string | null;
  created_by_user_id: string;
  created_at: Date;
  updated_at: Date;
  last_read_at: Date | null;
}

export interface ChatMessageRow {
  id: string;
  room_id: string;
  sender_user_id: string;
  kind: 'text' | 'file';
  text: string | null;
  file_url: string | null;
  file_name: string | null;
  file_size: string | null;
  reply_to_message_id: string | null;
  created_at: Date;
  sender_first_name?: string;
  sender_last_name?: string | null;
}

export interface SenderInfo {
  user_id: string;
  first_name: string;
  last_name: string | null;
}

@Injectable()
export class ChatDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async isMember(roomId: string, userId: string): Promise<boolean> {
    const row = await this.db(TABLE_NAMES.CHAT_ROOM_MEMBERS)
      .where({ room_id: roomId, user_id: userId })
      .first();
    return !!row;
  }

  async userBelongsToAgency(userId: string, agencyId: string): Promise<boolean> {
    const row = await this.db(TABLE_NAMES.AGENCY_USERS)
      .where({ user_id: userId, agency_id: agencyId, is_deleted: false })
      .first();
    return !!row;
  }

  async findRoomById(roomId: string): Promise<ChatRoomRow | undefined> {
    return this.db(TABLE_NAMES.CHAT_ROOMS).where({ id: roomId }).first();
  }

  async getMemberUserIds(roomId: string): Promise<string[]> {
    const rows = await this.db(TABLE_NAMES.CHAT_ROOM_MEMBERS).where({ room_id: roomId }).select('user_id');
    return rows.map((r) => r.user_id);
  }

  async getMembersForRooms(roomIds: string[]): Promise<ChatRoomMember[]> {
    if (roomIds.length === 0) return [];
    return this.db(TABLE_NAMES.CHAT_ROOM_MEMBERS)
      .join(TABLE_NAMES.AGENCY_USERS, `${TABLE_NAMES.AGENCY_USERS}.user_id`, `${TABLE_NAMES.CHAT_ROOM_MEMBERS}.user_id`)
      .whereIn(`${TABLE_NAMES.CHAT_ROOM_MEMBERS}.room_id`, roomIds)
      .andWhere(`${TABLE_NAMES.AGENCY_USERS}.is_deleted`, false)
      .select(
        `${TABLE_NAMES.CHAT_ROOM_MEMBERS}.room_id`,
        `${TABLE_NAMES.CHAT_ROOM_MEMBERS}.user_id`,
        `${TABLE_NAMES.AGENCY_USERS}.first_name`,
        `${TABLE_NAMES.AGENCY_USERS}.last_name`,
      );
  }

  async getLastMessagesForRooms(roomIds: string[]): Promise<ChatMessageRow[]> {
    if (roomIds.length === 0) return [];
    return this.db(TABLE_NAMES.CHAT_MESSAGES)
      .distinctOn('room_id')
      .whereIn('room_id', roomIds)
      .andWhere('is_deleted', false)
      .orderBy('room_id')
      .orderBy('created_at', 'desc');
  }

  async getUnreadCounts(userId: string, roomIds: string[]): Promise<Record<string, number>> {
    if (roomIds.length === 0) return {};
    const result = await this.db.raw(
      `select crm.room_id, count(cm.id)::int as count
       from ${TABLE_NAMES.CHAT_ROOM_MEMBERS} crm
       join ${TABLE_NAMES.CHAT_MESSAGES} cm
         on cm.room_id = crm.room_id
        and cm.sender_user_id != ?
        and cm.is_deleted = false
        and (crm.last_read_at is null or cm.created_at > crm.last_read_at)
       where crm.user_id = ? and crm.room_id = any(?)
       group by crm.room_id`,
      [userId, userId, roomIds],
    );
    const map: Record<string, number> = {};
    for (const row of result.rows) map[row.room_id] = Number(row.count);
    return map;
  }

  async findRoomsForUser(userId: string, agencyId: string): Promise<ChatRoomRow[]> {
    return this.db(TABLE_NAMES.CHAT_ROOMS)
      .join(TABLE_NAMES.CHAT_ROOM_MEMBERS, `${TABLE_NAMES.CHAT_ROOM_MEMBERS}.room_id`, `${TABLE_NAMES.CHAT_ROOMS}.id`)
      .where(`${TABLE_NAMES.CHAT_ROOM_MEMBERS}.user_id`, userId)
      .andWhere(`${TABLE_NAMES.CHAT_ROOMS}.agency_id`, agencyId)
      .select(`${TABLE_NAMES.CHAT_ROOMS}.*`, `${TABLE_NAMES.CHAT_ROOM_MEMBERS}.last_read_at`)
      .orderBy(`${TABLE_NAMES.CHAT_ROOMS}.updated_at`, 'desc');
  }

  // Finds a 1:1 room between exactly these two users, or creates one.
  async findOrCreateDmRoom(agencyId: string, userIdA: string, userIdB: string): Promise<ChatRoomRow> {
    const existing = await this.db.raw(
      `select cr.*
       from ${TABLE_NAMES.CHAT_ROOMS} cr
       where cr.agency_id = ? and cr.type = 'dm'
         and (select count(*) from ${TABLE_NAMES.CHAT_ROOM_MEMBERS} m where m.room_id = cr.id) = 2
         and exists (select 1 from ${TABLE_NAMES.CHAT_ROOM_MEMBERS} m where m.room_id = cr.id and m.user_id = ?)
         and exists (select 1 from ${TABLE_NAMES.CHAT_ROOM_MEMBERS} m where m.room_id = cr.id and m.user_id = ?)
       limit 1`,
      [agencyId, userIdA, userIdB],
    );
    if (existing.rows[0]) return existing.rows[0];

    return this.db.transaction(async (trx) => {
      const [room] = await trx(TABLE_NAMES.CHAT_ROOMS)
        .insert({ agency_id: agencyId, type: 'dm', created_by_user_id: userIdA })
        .returning('*');
      await trx(TABLE_NAMES.CHAT_ROOM_MEMBERS).insert([
        { room_id: room.id, user_id: userIdA },
        { room_id: room.id, user_id: userIdB },
      ]);
      return room;
    });
  }

  async createGroupRoom(agencyId: string, creatorUserId: string, name: string, memberUserIds: string[]): Promise<ChatRoomRow> {
    const uniqueMemberIds = Array.from(new Set([creatorUserId, ...memberUserIds]));
    return this.db.transaction(async (trx) => {
      const [room] = await trx(TABLE_NAMES.CHAT_ROOMS)
        .insert({ agency_id: agencyId, type: 'group', name, created_by_user_id: creatorUserId })
        .returning('*');
      await trx(TABLE_NAMES.CHAT_ROOM_MEMBERS).insert(
        uniqueMemberIds.map((userId) => ({ room_id: room.id, user_id: userId })),
      );
      return room;
    });
  }

  async findMessages(roomId: string, before?: Date, limit = 30): Promise<ChatMessageRow[]> {
    let query = this.db(TABLE_NAMES.CHAT_MESSAGES)
      .join(TABLE_NAMES.AGENCY_USERS, `${TABLE_NAMES.AGENCY_USERS}.user_id`, `${TABLE_NAMES.CHAT_MESSAGES}.sender_user_id`)
      .where(`${TABLE_NAMES.CHAT_MESSAGES}.room_id`, roomId)
      .andWhere(`${TABLE_NAMES.CHAT_MESSAGES}.is_deleted`, false)
      .select(
        `${TABLE_NAMES.CHAT_MESSAGES}.*`,
        `${TABLE_NAMES.AGENCY_USERS}.first_name as sender_first_name`,
        `${TABLE_NAMES.AGENCY_USERS}.last_name as sender_last_name`,
      )
      .orderBy(`${TABLE_NAMES.CHAT_MESSAGES}.created_at`, 'desc')
      .limit(limit);

    if (before) {
      query = query.andWhere(`${TABLE_NAMES.CHAT_MESSAGES}.created_at`, '<', before);
    }

    const rows = await query;
    return rows.reverse();
  }

  async findMessageById(id: string): Promise<ChatMessageRow | undefined> {
    return this.db(TABLE_NAMES.CHAT_MESSAGES)
      .join(TABLE_NAMES.AGENCY_USERS, `${TABLE_NAMES.AGENCY_USERS}.user_id`, `${TABLE_NAMES.CHAT_MESSAGES}.sender_user_id`)
      .where(`${TABLE_NAMES.CHAT_MESSAGES}.id`, id)
      .select(
        `${TABLE_NAMES.CHAT_MESSAGES}.*`,
        `${TABLE_NAMES.AGENCY_USERS}.first_name as sender_first_name`,
        `${TABLE_NAMES.AGENCY_USERS}.last_name as sender_last_name`,
      )
      .first();
  }

  async insertMessage(payload: {
    room_id: string;
    sender_user_id: string;
    kind: 'text' | 'file';
    text?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    file_size?: string | null;
    reply_to_message_id?: string | null;
  }): Promise<ChatMessageRow> {
    const [row] = await this.db(TABLE_NAMES.CHAT_MESSAGES).insert(payload).returning('id');
    await this.db(TABLE_NAMES.CHAT_ROOMS).where({ id: payload.room_id }).update({ updated_at: this.db.fn.now() });
    return this.findMessageById(row.id) as Promise<ChatMessageRow>;
  }

  async markRead(roomId: string, userId: string): Promise<void> {
    await this.db(TABLE_NAMES.CHAT_ROOM_MEMBERS)
      .where({ room_id: roomId, user_id: userId })
      .update({ last_read_at: this.db.fn.now() });
  }
}
