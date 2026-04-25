import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { GroupsDao, Group } from 'src/modules/admins/modules/groups/groups.dao';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { GroupMembersDao } from 'src/shared/dao/group-members.dao';
import { UsersAuthDao } from 'src/shared/dao/users-auth.dao';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { Knex } from 'knex';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsDao: GroupsDao,
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly groupMembersDao: GroupMembersDao,
    private readonly usersAuthDao: UsersAuthDao,
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
  ) {}

  async create(
    agencyId: string,
    createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    return this.groupsDao.insert({
      ...createGroupDto,
      agency_id: agencyId,
      departure_date: new Date(createGroupDto.departure_date),
      return_date: new Date(createGroupDto.return_date),
      status: createGroupDto.status || 'NEW',
    } as Partial<Group>);
  }

  async findByAgency(
    agencyId: string,
    pageIndex: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResult<Group>> {
    return this.groupsDao.findManyPaginatedWithJoins(
      { agency_id: agencyId } as Partial<Group>,
      pageIndex,
      pageSize,
    );
  }

  async findOne(id: string, agencyId: string): Promise<Group> {
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (group.agency_id !== agencyId) {
      throw new NotFoundException('Group not found for this agency');
    }
    return group;
  }

  async update(
    id: string,
    agencyId: string,
    updateGroupDto: UpdateGroupDto,
  ): Promise<Group | undefined> {
    const group = await this.findOne(id, agencyId);
    return this.groupsDao.updateById(id, updateGroupDto);
  }

  /**
   * Add a pilgrim to a group
   * Validation:
   * 1. Group must exist and belong to the agency
   * 2. Pilgrim must exist and not be deleted
   * 3. Pilgrim must be of type PILGRIM
   * 4. Pilgrim cannot already be in another group
   * 5. Group and pilgrim must belong to the same agency
   */
  async addPilgrimToGroup(groupId: string, agencyId: string, pilgrimId: string): Promise<any> {
    return this.db.transaction(async (trx) => {
      // 1. Check if group exists and belongs to the agency
      const group = await this.groupsDao.findById(groupId, trx);
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }
      if (group.agency_id !== agencyId) {
        throw new NotFoundException('Group not found for this agency');
      }

      // 2. Check if pilgrim exists
      const pilgrim = await this.pilgrimsDao.findById(pilgrimId, trx);
      if (!pilgrim) {
        throw new NotFoundException(`Pilgrim with ID ${pilgrimId} not found`);
      }

      // 3. Check if pilgrim is of type PILGRIM
      const user = await this.usersAuthDao.findUserById(pilgrim.user_id, trx);
      if (!user) {
        throw new NotFoundException(`User associated with pilgrim not found`);
      }
      if (user.type !== 'PILGRIM') {
        throw new BadRequestException('User must be of type PILGRIM to be added to a group');
      }

      // 4. Check if pilgrim is already in another group
      const existingMembership = await this.groupMembersDao.findByPilgrimId(pilgrimId, trx);
      if (existingMembership) {
        throw new BadRequestException('Pilgrim is already assigned to another group');
      }

      // 5. Verify pilgrim belongs to the same agency as the group
      if (pilgrim.agency_id !== group.agency_id) {
        throw new BadRequestException(
          'Pilgrim must belong to the same agency as the group to be added',
        );
      }

      // Add pilgrim to group
      const groupMember = await this.groupMembersDao.addPilgrimToGroup(
        groupId,
        pilgrimId,
        trx,
      );

      return {
        message: 'Pilgrim successfully added to group',
        data: {
          id: groupMember.id,
          group_id: groupMember.group_id,
          pilgrim_id: groupMember.pilgrim_id,
          pilgrim_name: pilgrim.full_name,
          joined_at: groupMember.joined_at,
        },
      };
    });
  }

  /**
   * Remove a pilgrim from their group
   */
  async removePilgrimFromGroup(groupId: string, agencyId: string, pilgrimId: string): Promise<any> {
    return this.db.transaction(async (trx) => {
      // Check if group exists and belongs to the agency
      const group = await this.groupsDao.findById(groupId, trx);
      if (!group) {
        throw new NotFoundException(`Group with ID ${groupId} not found`);
      }
      if (group.agency_id !== agencyId) {
        throw new NotFoundException('Group not found for this agency');
      }

      // Check if pilgrim exists
      const pilgrim = await this.pilgrimsDao.findById(pilgrimId, trx);
      if (!pilgrim) {
        throw new NotFoundException(`Pilgrim with ID ${pilgrimId} not found`);
      }

      // Check if pilgrim is in this group
      const membership = await this.groupMembersDao.findByPilgrimId(pilgrimId, trx);
      if (!membership) {
        throw new BadRequestException('Pilgrim is not assigned to any group');
      }
      if (membership.group_id !== groupId) {
        throw new BadRequestException('Pilgrim is not a member of this group');
      }

      // Remove pilgrim from group
      const removed = await this.groupMembersDao.removePilgrimFromGroup(pilgrimId, trx);

      if (!removed) {
        throw new BadRequestException('Failed to remove pilgrim from group');
      }

      return {
        message: 'Pilgrim successfully removed from group',
        data: {
          pilgrim_id: pilgrimId,
          pilgrim_name: pilgrim.full_name,
        },
      };
    });
  }

  /**
   * Get all pilgrims in a group
   */
  async getPilgrimsInGroup(groupId: string, agencyId: string): Promise<any> {
    // Check if group exists and belongs to the agency
    const group = await this.groupsDao.findById(groupId);
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }
    if (group.agency_id !== agencyId) {
      throw new NotFoundException('Group not found for this agency');
    }

    // Get all members in the group
    const members = await this.groupMembersDao.getGroupMembersWithDetails(groupId);

    // Fetch pilgrim details for each member
    const membersWithDetails = await Promise.all(
      members.map(async (member: any) => {
        const pilgrim = await this.pilgrimsDao.findById(member.pilgrim_id);
        return {
          id: member.id,
          group_id: member.group_id,
          pilgrim_id: member.pilgrim_id,
          full_name: pilgrim?.full_name || 'Unknown',
          phone: pilgrim?.phone || null,
          email: pilgrim?.email || null,
          agency_id: pilgrim?.agency_id || null,
          joined_at: member.joined_at,
          created_at: member.created_at,
          agency: pilgrim?.agency || null,
        };
      })
    );

    return membersWithDetails;
  }

  /**
   * Get group information for a specific pilgrim
   */
  async getPilgrimGroup(pilgrimId: string): Promise<any> {
    // Check if pilgrim exists
    const pilgrim = await this.pilgrimsDao.findById(pilgrimId);
    if (!pilgrim) {
      throw new NotFoundException(`Pilgrim with ID ${pilgrimId} not found`);
    }

    // Find pilgrim's group
    const membership = await this.groupMembersDao.findByPilgrimId(pilgrimId);
    if (!membership) {
      return {
        pilgrim_id: pilgrimId,
        pilgrim_name: pilgrim.full_name,
        group: null,
        message: 'Pilgrim is not assigned to any group',
      };
    }

    // Get group details
    const group = await this.groupsDao.findById(membership.group_id);

    return {
      pilgrim_id: pilgrimId,
      pilgrim_name: pilgrim.full_name,
      group: {
        id: group?.id,
        name: group?.name,
        status: group?.status,
        departure_date: group?.departure_date,
        return_date: group?.return_date,
      },
    };
  }
}
