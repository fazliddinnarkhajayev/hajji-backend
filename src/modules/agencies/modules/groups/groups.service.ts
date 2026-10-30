import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { GroupsDao, Group, GroupListFilters } from 'src/modules/admins/modules/groups/groups.dao';
import { GROUP_STATUSES, GroupStatus, storedGroupStatus } from 'src/shared/dao/group-status';
import { BulkUpdateMemberDocumentsDto, UpdateMemberDocumentsDto } from './dto/update-member-documents.dto';
import { buildDocumentsWorkbook, DocumentsExportType } from './group-documents.export';
import { PaginatedResult, PaginationMeta } from 'src/shared/interfaces/pagination.interface';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { GroupMembersDao } from 'src/shared/dao/group-members.dao';
import { GroupVoiceKeysDao } from 'src/shared/dao/group-voice-keys.dao';
import { UsersAuthDao } from 'src/shared/dao/users-auth.dao';
import { RoomRequestsDao, RoomRequestWithMembers } from 'src/shared/dao/room-requests.dao';
import { RoomsDao, RoomInput, RoomWithMembers } from 'src/shared/dao/rooms.dao';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { Knex } from 'knex';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsDao: GroupsDao,
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly groupMembersDao: GroupMembersDao,
    private readonly usersAuthDao: UsersAuthDao,
    private readonly roomRequestsDao: RoomRequestsDao,
    private readonly roomsDao: RoomsDao,
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
    private readonly voiceKeysDao: GroupVoiceKeysDao,
  ) {}

  async create(agencyId: string, createGroupDto: CreateGroupDto): Promise<Group> {
    // The group and its voice key ("Router orqali") are created together.
    return this.groupsDao.transaction(async (trx) => {
      const group = await this.groupsDao.insert({
        ...createGroupDto,
        agency_id: agencyId,
        departure_date: new Date(createGroupDto.departure_date),
        return_date: new Date(createGroupDto.return_date),
        status: storedGroupStatus(createGroupDto.status) ?? 'FORMING',
      } as Partial<Group>, trx);
      await this.voiceKeysDao.ensure(group.id, trx);
      return group;
    });
  }

  /**
   * New voice key for the group (key_version + 1), e.g. after removing a member. Phones get it on
   * their next online profile refresh; until then the old key keeps working offline (documented limit).
   * Returns the version only — never the key.
   */
  async rotateVoiceKey(id: string, agencyId: string): Promise<{ key_version: number; rotated_at: Date }> {
    await this.findOne(id, agencyId);
    const r = await this.voiceKeysDao.rotate(id);
    if (!r) throw new NotFoundException('Group not found');
    return r;
  }

  async findByAgency(
    agencyId: string,
    pageIndex = 1,
    pageSize = 10,
    filters: GroupListFilters = {},
  ): Promise<PaginatedResult<Group>> {
    if (filters.status && !(GROUP_STATUSES as readonly string[]).includes(filters.status)) {
      throw new BadRequestException('Unknown group status');
    }
    return this.groupsDao.findManyPaginatedWithJoins({ agency_id: agencyId } as Partial<Group>, pageIndex, pageSize, undefined, filters);
  }

  /**
   * Numbers for the status cards on the agency "Groups" page: per effective status the group and
   * people counts plus the one hint each card shows.
   */
  async getStats(agencyId: string) {
    const rows = await this.groupsDao.findStatsRows(agencyId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const day = (d: Date | string) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const DAY = 86_400_000;

    const by = Object.fromEntries(GROUP_STATUSES.map((s) => [s, { groups: 0, members: 0 }])) as Record<GroupStatus, { groups: number; members: number }>;
    for (const r of rows) {
      by[r.status].groups += 1;
      by[r.status].members += r.members_count;
    }
    const of = (s: GroupStatus) => rows.filter((r) => r.status === s);
    const earliest = (list: typeof rows, key: 'departure_date' | 'return_date', dir: 1 | -1) =>
      list.slice().sort((a, b) => dir * (new Date(a[key]).getTime() - new Date(b[key]).getTime()))[0];

    const preparing = [...of('FORMING'), ...of('FORMED')];
    const next = earliest(preparing, 'departure_date', 1);
    const last = earliest(of('TRIP_ENDED'), 'return_date', -1);

    return {
      total: { groups: rows.length, members: rows.reduce((n, r) => n + r.members_count, 0) },
      FORMING: {
        ...by.FORMING,
        docs_incomplete_groups: of('FORMING').filter((r) => r.docs_incomplete_count > 0).length,
        docs_incomplete_members: of('FORMING').reduce((n, r) => n + r.docs_incomplete_count, 0),
        empty_groups: of('FORMING').filter((r) => r.members_count === 0).length,
      },
      FORMED: { ...by.FORMED },
      IN_TRIP: {
        ...by.IN_TRIP,
        docs_incomplete_groups: of('IN_TRIP').filter((r) => r.docs_incomplete_count > 0).length,
        trips: of('IN_TRIP').map((r) => ({
          id: r.id,
          name: r.name,
          day: Math.floor((today.getTime() - day(r.departure_date).getTime()) / DAY) + 1,
          total_days: Math.floor((day(r.return_date).getTime() - day(r.departure_date).getTime()) / DAY) + 1,
          return_date: r.return_date,
        })),
      },
      TRIP_ENDED: { ...by.TRIP_ENDED, last_return: last ? { id: last.id, name: last.name, return_date: last.return_date } : null },
      CANCELLED: { ...by.CANCELLED },
      next_departure: next ? { id: next.id, name: next.name, departure_date: next.departure_date, status: next.status } : null,
    };
  }

  async findOne(id: string, agencyId: string): Promise<Group> {
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) throw new NotFoundException('Group not found');
    if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');
    return group;
  }

  async update(id: string, agencyId: string, updateGroupDto: UpdateGroupDto): Promise<Group | undefined> {
    await this.findOne(id, agencyId);
    await this.groupsDao.updateById(id, { ...updateGroupDto, status: storedGroupStatus(updateGroupDto.status) } as Partial<Group>);
    return this.groupsDao.findByIdWithJoins(id);
  }

  async remove(id: string, agencyId: string): Promise<{ success: boolean }> {
    await this.findOne(id, agencyId);
    await this.db.transaction(async (trx) => {
      await this.groupMembersDao.releaseGroup(id, trx);
      await this.groupsDao.deleteById(id, trx);
    });
    return { success: true };
  }

  // ── Group Members ──────────────────────────────────────────

  async addPilgrimToGroup(groupId: string, agencyId: string, pilgrimId: string): Promise<any> {
    return this.db.transaction(async (trx) => {
      const group = await this.groupsDao.findById(groupId, trx);
      if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
      if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');

      const pilgrim = await this.pilgrimsDao.findById(pilgrimId, trx);
      if (!pilgrim) throw new NotFoundException(`Pilgrim with ID ${pilgrimId} not found`);

      const user = await this.usersAuthDao.findUserById(pilgrim.user_id, trx);
      if (!user) throw new NotFoundException(`User associated with pilgrim not found`);
      if (user.type !== 'PILGRIM') throw new BadRequestException('User must be of type PILGRIM to be added to a group');

      const existingMembership = await this.groupMembersDao.findByPilgrimId(pilgrimId, trx);
      if (existingMembership) throw new BadRequestException('Pilgrim is already assigned to another group');

      if (pilgrim.agency_id !== group.agency_id) {
        throw new BadRequestException('Pilgrim must belong to the same agency as the group to be added');
      }

      const groupMember = await this.groupMembersDao.addPilgrimToGroup(groupId, pilgrimId, trx);

      const fullName = [pilgrim.first_name, pilgrim.middle_name, pilgrim.last_name].filter(Boolean).join(' ');
      return {
        message: 'Pilgrim successfully added to group',
        data: {
          id: groupMember.id,
          group_id: groupMember.group_id,
          pilgrim_id: groupMember.pilgrim_id,
          pilgrim_name: fullName || 'Unknown',
          joined_at: groupMember.joined_at,
        },
      };
    });
  }

  async removePilgrimFromGroup(groupId: string, agencyId: string, pilgrimId: string): Promise<any> {
    return this.db.transaction(async (trx) => {
      const group = await this.groupsDao.findById(groupId, trx);
      if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
      if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');

      const pilgrim = await this.pilgrimsDao.findById(pilgrimId, trx);
      if (!pilgrim) throw new NotFoundException(`Pilgrim with ID ${pilgrimId} not found`);

      const membership = await this.groupMembersDao.findByPilgrimId(pilgrimId, trx);
      if (!membership) throw new BadRequestException('Pilgrim is not assigned to any group');
      if (membership.group_id !== groupId) throw new BadRequestException('Pilgrim is not a member of this group');

      const removed = await this.groupMembersDao.removePilgrimFromGroup(pilgrimId, trx);
      if (!removed) throw new BadRequestException('Failed to remove pilgrim from group');

      const fullName = [pilgrim.first_name, pilgrim.middle_name, pilgrim.last_name].filter(Boolean).join(' ');
      return {
        message: 'Pilgrim successfully removed from group',
        data: { pilgrim_id: pilgrimId, pilgrim_name: fullName || 'Unknown' },
      };
    });
  }

  async getPilgrimsInGroup(
    groupId: string,
    agencyId: string,
    pageIndex: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResult<any>> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
    if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');

    const { records, total } = await this.groupMembersDao.getGroupMembersWithDetailsPaginated(
      groupId,
      pageIndex,
      pageSize,
    );

    return new PaginatedResult(records, {
      total_items_count: total,
      total_pages_count: Math.ceil(total / pageSize) || 1,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  // ── Visa / ticket ──────────────────────────────────────────

  private documentsPatch(dto: UpdateMemberDocumentsDto, userId?: string) {
    const keys = ['visa_status', 'visa_number', 'visa_issued_at', 'visa_expires_at', 'ticket_status',
      'ticket_number', 'flight_number', 'flight_date', 'pnr', 'documents_note'] as const;
    const patch: Record<string, unknown> = {};
    for (const k of keys) if (dto[k] !== undefined) patch[k] = dto[k];
    if (Object.keys(patch).length === 0) throw new BadRequestException('Nothing to update');
    patch.documents_updated_at = new Date();
    patch.documents_updated_by_id = userId ?? null;
    return patch;
  }

  async updateMemberDocuments(groupId: string, agencyId: string, pilgrimId: string, dto: UpdateMemberDocumentsDto, userId?: string) {
    await this.verifyGroupOwnership(groupId, agencyId);
    const changed = await this.groupMembersDao.updateDocuments(groupId, [pilgrimId], this.documentsPatch(dto, userId) as any);
    if (!changed) throw new BadRequestException('Pilgrim is not a member of this group');
    return this.groupsDao.findByIdWithJoins(groupId);
  }

  async bulkUpdateMemberDocuments(groupId: string, agencyId: string, dto: BulkUpdateMemberDocumentsDto, userId?: string) {
    await this.verifyGroupOwnership(groupId, agencyId);
    const { pilgrim_ids, ...rest } = dto;
    const updated = await this.groupMembersDao.updateDocuments(groupId, Array.from(new Set(pilgrim_ids)), this.documentsPatch(rest, userId) as any);
    const group = await this.groupsDao.findByIdWithJoins(groupId);
    return { updated, group };
  }

  async exportDocuments(groupId: string, agencyId: string, type: DocumentsExportType): Promise<{ buffer: Buffer; filename: string }> {
    if (type !== 'visa' && type !== 'ticket') throw new BadRequestException('type must be visa or ticket');
    const group = await this.findOne(groupId, agencyId);
    const members = await this.groupMembersDao.findForExport(groupId);
    const buffer = await buildDocumentsWorkbook(type, group, members);
    const safe = group.name.replace(/[^\p{L}\p{N}\- ]+/gu, '').trim().replace(/\s+/g, '_') || 'guruh';
    return { buffer, filename: `${safe}_${type === 'visa' ? 'viza' : 'aviabilet'}.xlsx` };
  }

  // ── Room Requests ──────────────────────────────────────────

  private async verifyGroupOwnership(groupId: string, agencyId: string): Promise<void> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');
  }

  async getRoomRequests(groupId: string, agencyId: string): Promise<RoomRequestWithMembers[]> {
    await this.verifyGroupOwnership(groupId, agencyId);
    return this.roomRequestsDao.findByGroupId(groupId);
  }

  async createRoomRequest(groupId: string, agencyId: string, name: string, userId?: string): Promise<any> {
    await this.verifyGroupOwnership(groupId, agencyId);
    return this.roomRequestsDao.create(groupId, name, userId);
  }

  async updateRoomRequest(groupId: string, roomRequestId: string, agencyId: string, name: string): Promise<any> {
    await this.verifyGroupOwnership(groupId, agencyId);
    const roomRequest = await this.roomRequestsDao.findById(roomRequestId);
    if (!roomRequest) throw new NotFoundException('Room request not found');
    if (roomRequest.group_id !== groupId) throw new NotFoundException('Room request does not belong to this group');
    return this.roomRequestsDao.updateName(roomRequestId, name);
  }

  async deleteRoomRequest(groupId: string, roomRequestId: string, agencyId: string): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);
    const roomRequest = await this.roomRequestsDao.findById(roomRequestId);
    if (!roomRequest) throw new NotFoundException('Room request not found');
    if (roomRequest.group_id !== groupId) throw new NotFoundException('Room request does not belong to this group');
    await this.roomRequestsDao.delete(roomRequestId);
    return { success: true };
  }

  async addRoomRequestMember(
    groupId: string,
    roomRequestId: string,
    agencyId: string,
    pilgrimId: string,
  ): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);

    const roomRequest = await this.roomRequestsDao.findById(roomRequestId);
    if (!roomRequest) throw new NotFoundException('Room request not found');
    if (roomRequest.group_id !== groupId) throw new NotFoundException('Room request does not belong to this group');

    const membership = await this.db(TABLE_NAMES.GROUP_MEMBERS)
      .where({ group_id: groupId, pilgrim_id: pilgrimId })
      .first();
    if (!membership) throw new BadRequestException('Pilgrim is not a member of this group');

    const existingRoomMembership = await this.roomRequestsDao.findMemberByPilgrimId(pilgrimId);
    if (existingRoomMembership) throw new BadRequestException('Pilgrim is already assigned to a room request');

    await this.roomRequestsDao.addMember(roomRequestId, pilgrimId);
    return { success: true };
  }

  async removeRoomRequestMember(
    groupId: string,
    roomRequestId: string,
    agencyId: string,
    pilgrimId: string,
  ): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);

    const roomRequest = await this.roomRequestsDao.findById(roomRequestId);
    if (!roomRequest) throw new NotFoundException('Room request not found');
    if (roomRequest.group_id !== groupId) throw new NotFoundException('Room request does not belong to this group');

    const existingRoomMembership = await this.roomRequestsDao.findMemberByPilgrimId(pilgrimId);
    if (!existingRoomMembership || existingRoomMembership.room_request_id !== roomRequestId) {
      throw new BadRequestException('Pilgrim is not in this room request');
    }

    await this.roomRequestsDao.removeMember(pilgrimId);
    return { success: true };
  }

  // ── Rooms ──────────────────────────────────────────────────

  async getRooms(groupId: string, agencyId: string): Promise<RoomWithMembers[]> {
    await this.verifyGroupOwnership(groupId, agencyId);
    return this.roomsDao.findByGroupId(groupId);
  }

  async createRooms(groupId: string, agencyId: string, rooms: RoomInput[], userId?: string): Promise<any> {
    await this.verifyGroupOwnership(groupId, agencyId);
    return this.roomsDao.createBulk(groupId, rooms, userId);
  }

  async deleteRoom(groupId: string, roomId: string, agencyId: string): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);
    const room = await this.roomsDao.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.group_id !== groupId) throw new NotFoundException('Room does not belong to this group');
    await this.roomsDao.delete(roomId);
    return { success: true };
  }

  async addRoomMember(groupId: string, roomId: string, agencyId: string, pilgrimId: string): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);

    try {
      await this.db.transaction(async (trx) => {
        const room = await this.roomsDao.findById(roomId, trx);
        if (!room) throw new NotFoundException('Room not found');
        if (room.group_id !== groupId) throw new NotFoundException('Room does not belong to this group');

        const membership = await trx(TABLE_NAMES.GROUP_MEMBERS)
          .where({ group_id: groupId, pilgrim_id: pilgrimId })
          .first();
        if (!membership) throw new BadRequestException('Pilgrim is not a member of this group');

        const currentCount = await this.roomsDao.countMembers(roomId, trx);
        if (currentCount >= room.capacity) throw new BadRequestException('Room is at full capacity');

        const existing = await this.roomsDao.findMemberByPilgrimId(pilgrimId, trx);
        if (existing) throw new BadRequestException('Pilgrim is already assigned to a room');

        await this.roomsDao.addMember(roomId, pilgrimId, trx);
      });
    } catch (err: any) {
      // Unique constraint violation from DB (race condition fallback)
      if (err?.code === '23505') throw new BadRequestException('Pilgrim is already assigned to a room');
      throw err;
    }

    return { success: true };
  }

  async removeRoomMember(groupId: string, roomId: string, agencyId: string, pilgrimId: string): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);

    const room = await this.roomsDao.findById(roomId);
    if (!room) throw new NotFoundException('Room not found');
    if (room.group_id !== groupId) throw new NotFoundException('Room does not belong to this group');

    const existing = await this.roomsDao.findMemberByPilgrimId(pilgrimId);
    if (!existing || existing.room_id !== roomId) throw new BadRequestException('Pilgrim is not in this room');

    await this.roomsDao.removeMember(pilgrimId);
    return { success: true };
  }
}
