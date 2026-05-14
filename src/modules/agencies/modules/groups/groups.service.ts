import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { GroupsDao, Group } from 'src/modules/admins/modules/groups/groups.dao';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { GroupMembersDao } from 'src/shared/dao/group-members.dao';
import { UsersAuthDao } from 'src/shared/dao/users-auth.dao';
import { RoomGroupsDao, RoomGroupWithMembers } from 'src/shared/dao/room-groups.dao';
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
    private readonly roomGroupsDao: RoomGroupsDao,
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
  ) {}

  async create(agencyId: string, createGroupDto: CreateGroupDto): Promise<Group> {
    return this.groupsDao.insert({
      ...createGroupDto,
      agency_id: agencyId,
      departure_date: new Date(createGroupDto.departure_date),
      return_date: new Date(createGroupDto.return_date),
      status: createGroupDto.status || 'NEW',
    } as Partial<Group>);
  }

  async findByAgency(agencyId: string, pageIndex = 1, pageSize = 10): Promise<PaginatedResult<Group>> {
    return this.groupsDao.findManyPaginatedWithJoins({ agency_id: agencyId } as Partial<Group>, pageIndex, pageSize);
  }

  async findOne(id: string, agencyId: string): Promise<Group> {
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) throw new NotFoundException('Group not found');
    if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');
    return group;
  }

  async update(id: string, agencyId: string, updateGroupDto: UpdateGroupDto): Promise<Group | undefined> {
    await this.findOne(id, agencyId);
    return this.groupsDao.updateById(id, updateGroupDto);
  }

  async remove(id: string, agencyId: string): Promise<{ success: boolean }> {
    await this.findOne(id, agencyId);
    await this.groupsDao.deleteById(id);
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

  async getPilgrimsInGroup(groupId: string, agencyId: string): Promise<any> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException(`Group with ID ${groupId} not found`);
    if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');

    const members = await this.groupMembersDao.getGroupMembersWithDetails(groupId);

    return Promise.all(
      members.map(async (member: any) => {
        const pilgrim = await this.pilgrimsDao.findById(member.pilgrim_id);
        const fullName = pilgrim ? [pilgrim.first_name, pilgrim.middle_name, pilgrim.last_name].filter(Boolean).join(' ') : 'Unknown';
        return {
          id: member.id,
          group_id: member.group_id,
          pilgrim_id: member.pilgrim_id,
          full_name: fullName,
          phone: pilgrim?.phone || null,
          email: pilgrim?.email || null,
          agency_id: pilgrim?.agency_id || null,
          joined_at: member.joined_at,
          created_at: member.created_at,
        };
      }),
    );
  }

  // ── Room Groups ────────────────────────────────────────────

  private async verifyGroupOwnership(groupId: string, agencyId: string): Promise<void> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');
  }

  async getRoomGroups(groupId: string, agencyId: string): Promise<RoomGroupWithMembers[]> {
    await this.verifyGroupOwnership(groupId, agencyId);
    return this.roomGroupsDao.findByGroupId(groupId);
  }

  async createRoomGroup(groupId: string, agencyId: string, name: string, userId?: string): Promise<any> {
    await this.verifyGroupOwnership(groupId, agencyId);
    return this.roomGroupsDao.create(groupId, name, userId);
  }

  async updateRoomGroup(groupId: string, roomGroupId: string, agencyId: string, name: string): Promise<any> {
    await this.verifyGroupOwnership(groupId, agencyId);
    const roomGroup = await this.roomGroupsDao.findById(roomGroupId);
    if (!roomGroup) throw new NotFoundException('Room group not found');
    if (roomGroup.group_id !== groupId) throw new NotFoundException('Room group does not belong to this group');
    return this.roomGroupsDao.updateName(roomGroupId, name);
  }

  async deleteRoomGroup(groupId: string, roomGroupId: string, agencyId: string): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);
    const roomGroup = await this.roomGroupsDao.findById(roomGroupId);
    if (!roomGroup) throw new NotFoundException('Room group not found');
    if (roomGroup.group_id !== groupId) throw new NotFoundException('Room group does not belong to this group');
    await this.roomGroupsDao.delete(roomGroupId);
    return { success: true };
  }

  async addRoomGroupMember(
    groupId: string,
    roomGroupId: string,
    agencyId: string,
    pilgrimId: string,
  ): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);

    const roomGroup = await this.roomGroupsDao.findById(roomGroupId);
    if (!roomGroup) throw new NotFoundException('Room group not found');
    if (roomGroup.group_id !== groupId) throw new NotFoundException('Room group does not belong to this group');

    const membership = await this.db(TABLE_NAMES.GROUP_MEMBERS)
      .where({ group_id: groupId, pilgrim_id: pilgrimId })
      .first();
    if (!membership) throw new BadRequestException('Pilgrim is not a member of this group');

    const existingRoomMembership = await this.roomGroupsDao.findMemberByPilgrimId(pilgrimId);
    if (existingRoomMembership) throw new BadRequestException('Pilgrim is already assigned to a room group');

    await this.roomGroupsDao.addMember(roomGroupId, pilgrimId);
    return { success: true };
  }

  async removeRoomGroupMember(
    groupId: string,
    roomGroupId: string,
    agencyId: string,
    pilgrimId: string,
  ): Promise<{ success: boolean }> {
    await this.verifyGroupOwnership(groupId, agencyId);

    const roomGroup = await this.roomGroupsDao.findById(roomGroupId);
    if (!roomGroup) throw new NotFoundException('Room group not found');
    if (roomGroup.group_id !== groupId) throw new NotFoundException('Room group does not belong to this group');

    const existingRoomMembership = await this.roomGroupsDao.findMemberByPilgrimId(pilgrimId);
    if (!existingRoomMembership || existingRoomMembership.room_group_id !== roomGroupId) {
      throw new BadRequestException('Pilgrim is not in this room group');
    }

    await this.roomGroupsDao.removeMember(pilgrimId);
    return { success: true };
  }
}
