import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ChatDao, ChatMessageRow } from './chat.dao';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { SendMessageDto } from './dto/send-message.dto';

function fullName(first: string, last?: string | null): string {
  return [first, last].filter(Boolean).join(' ');
}

@Injectable()
export class ChatService {
  constructor(
    private readonly chatDao: ChatDao,
    private readonly webSocketService: WebSocketService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private mapMessage(row: ChatMessageRow) {
    return {
      id: row.id,
      room_id: row.room_id,
      sender_user_id: row.sender_user_id,
      sender_name: fullName(row.sender_first_name ?? '', row.sender_last_name),
      kind: row.kind,
      text: row.text,
      file_url: row.file_url,
      file_name: row.file_name,
      file_size: row.file_size,
      reply_to_message_id: row.reply_to_message_id,
      created_at: row.created_at,
    };
  }

  async listRooms(userId: string, agencyId: string) {
    const rooms = await this.chatDao.findRoomsForUser(userId, agencyId);
    if (rooms.length === 0) return [];

    const roomIds = rooms.map((r) => r.id);
    const [members, lastMessages, unreadCounts] = await Promise.all([
      this.chatDao.getMembersForRooms(roomIds),
      this.chatDao.getLastMessagesForRooms(roomIds),
      this.chatDao.getUnreadCounts(userId, roomIds),
    ]);

    const membersByRoom = new Map<string, typeof members>();
    for (const m of members) {
      const list = membersByRoom.get(m.room_id) ?? [];
      list.push(m);
      membersByRoom.set(m.room_id, list);
    }
    const lastMessageByRoom = new Map(lastMessages.map((m) => [m.room_id, m]));

    return rooms.map((room) => {
      const roomMembers = membersByRoom.get(room.id) ?? [];
      const otherMembers = roomMembers.filter((m) => m.user_id !== userId);
      const lastMessage = lastMessageByRoom.get(room.id);
      const isOnline = otherMembers.some((m) => this.webSocketService.getClientsByUserId(m.user_id).length > 0);

      return {
        id: room.id,
        type: room.type,
        name: room.type === 'dm' ? fullName(otherMembers[0]?.first_name ?? '', otherMembers[0]?.last_name) : room.name,
        member_count: roomMembers.length,
        online: room.type === 'dm' ? isOnline : undefined,
        last_message: lastMessage
          ? { kind: lastMessage.kind, text: lastMessage.text, file_name: lastMessage.file_name, created_at: lastMessage.created_at }
          : null,
        unread_count: unreadCounts[room.id] ?? 0,
        updated_at: room.updated_at,
      };
    });
  }

  async getMessages(roomId: string, userId: string, agencyId: string, before?: string, limit?: number) {
    await this.assertMember(roomId, userId, agencyId);
    const rows = await this.chatDao.findMessages(roomId, before ? new Date(before) : undefined, limit);

    const replyIds = rows.map((r) => r.reply_to_message_id).filter((id): id is string => !!id);
    const replySources = await Promise.all(replyIds.map((id) => this.chatDao.findMessageById(id)));
    const replyById = new Map(replySources.filter(Boolean).map((r) => [r!.id, r!]));

    return rows.map((row) => {
      const mapped = this.mapMessage(row);
      const reply = row.reply_to_message_id ? replyById.get(row.reply_to_message_id) : undefined;
      return {
        ...mapped,
        reply_to_text: reply ? (reply.kind === 'file' ? reply.file_name : reply.text) : null,
      };
    });
  }

  async sendMessage(roomId: string, userId: string, agencyId: string, dto: SendMessageDto, file?: { url: string; name: string; size: string }) {
    await this.assertMember(roomId, userId, agencyId);
    if (!dto.text && !file) throw new BadRequestException('Message must have text or a file');

    const row = await this.chatDao.insertMessage({
      room_id: roomId,
      sender_user_id: userId,
      kind: file ? 'file' : 'text',
      text: dto.text ?? null,
      file_url: file?.url ?? null,
      file_name: file?.name ?? null,
      file_size: file?.size ?? null,
      reply_to_message_id: dto.reply_to_message_id ?? null,
    });

    const mapped = this.mapMessage(row);
    const memberIds = await this.chatDao.getMemberUserIds(roomId);
    const preview = file ? `📎 ${file.name}` : dto.text ?? '';

    memberIds
      .filter((id) => id !== userId)
      .forEach((memberId) => {
        this.webSocketService.broadcastToUser(memberId, 'message:new', { message: mapped, room_id: roomId });
        this.notificationsService.notify(memberId, 'CHAT_MESSAGE', mapped.sender_name, {
          message: preview,
          subject: mapped.sender_name,
          link: { screen: 'chatDetail', id: roomId },
        });
      });

    return mapped;
  }

  async markRead(roomId: string, userId: string, agencyId: string) {
    await this.assertMember(roomId, userId, agencyId);
    await this.chatDao.markRead(roomId, userId);
    const memberIds = await this.chatDao.getMemberUserIds(roomId);
    memberIds
      .filter((id) => id !== userId)
      .forEach((memberId) => this.webSocketService.broadcastToUser(memberId, 'message:read', { room_id: roomId, reader_user_id: userId }));
    return { success: true };
  }

  async createRoom(userId: string, agencyId: string, dto: CreateRoomDto) {
    if (dto.type === 'dm') {
      if (!dto.target_user_id) throw new BadRequestException('target_user_id is required for a dm room');
      if (dto.target_user_id === userId) throw new BadRequestException('Cannot start a conversation with yourself');
      const belongs = await this.chatDao.userBelongsToAgency(dto.target_user_id, agencyId);
      if (!belongs) throw new NotFoundException('Target user not found in your agency');
      return this.chatDao.findOrCreateDmRoom(agencyId, userId, dto.target_user_id);
    }

    if (!dto.name) throw new BadRequestException('name is required for a group room');
    if (!dto.member_user_ids?.length) throw new BadRequestException('member_user_ids is required for a group room');
    const memberships = await Promise.all(dto.member_user_ids.map((id) => this.chatDao.userBelongsToAgency(id, agencyId)));
    if (memberships.some((ok) => !ok)) throw new NotFoundException('One or more members are not in your agency');

    return this.chatDao.createGroupRoom(agencyId, userId, dto.name, dto.member_user_ids);
  }

  private async assertMember(roomId: string, userId: string, agencyId: string): Promise<void> {
    const room = await this.chatDao.findRoomById(roomId);
    if (!room || room.agency_id !== agencyId) throw new NotFoundException('Room not found');
    const isMember = await this.chatDao.isMember(roomId, userId);
    if (!isMember) throw new ForbiddenException('You are not a member of this room');
  }
}
