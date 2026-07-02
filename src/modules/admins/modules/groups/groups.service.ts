import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { GroupsDao, Group } from './groups.dao';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { RoomRequestsDao, RoomRequestWithMembers } from 'src/shared/dao/room-requests.dao';
import { GroupMembersDao } from 'src/shared/dao/group-members.dao';
import { RoomsDao, RoomWithMembers } from 'src/shared/dao/rooms.dao';
import { GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao } from 'src/modules/agencies/modules/plans/plans.dao';

@Injectable()
export class GroupsService {
  constructor(
    private readonly groupsDao: GroupsDao,
    private readonly webSocketService: WebSocketService,
    private readonly notificationsService: NotificationsService,
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly roomRequestsDao: RoomRequestsDao,
    private readonly groupMembersDao: GroupMembersDao,
    private readonly roomsDao: RoomsDao,
    private readonly plansDao: GroupPlansDao,
    private readonly proceduresDao: PlanProceduresDao,
    private readonly confirmationsDao: PlanConfirmationsDao,
  ) {}

  async create(dto: CreateGroupDto, userId?: string): Promise<Group> {
    // Validate dates
    const departureDateObj = new Date(dto.departure_date);
    const returnDateObj = new Date(dto.return_date);

    if (returnDateObj <= departureDateObj) {
      throw new BadRequestException('Return date must be after departure date');
    }

    const createdGroup = await this.groupsDao.insert({
      ...dto,
      status: 'NEW',
      created_by_id: userId,
    } as Partial<Group>);

    // Get created group with joins
    const groupWithDetails = await this.groupsDao.findByIdWithJoins(createdGroup.id);

    // Send notification to all agency users
    const agencyUsers = await this.agencyUsersDao.findMany({
      agency_id: dto.agency_id,
      is_deleted: false,
    } as any);

    agencyUsers.forEach((agencyUser) => {
      this.webSocketService.broadcastToUser(agencyUser.user_id, 'group_created', {
        type: 'GROUP_CREATED',
        group: groupWithDetails,
        message: `A new group "${groupWithDetails?.name}" has been created`,
      });
      this.notificationsService.notify(agencyUser.user_id, 'GROUP_CREATED', 'New group created', {
        message: `A new group "${groupWithDetails?.name}" has been created`,
        subject: groupWithDetails?.name,
        link: { screen: 'groupDetail', id: groupWithDetails?.id },
      });
    });

    return createdGroup;
  }

  async findAll(
    pageIndex: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResult<Group>> {
    return this.groupsDao.findManyPaginatedWithJoins({}, pageIndex, pageSize);
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

  async findOne(id: string): Promise<Group> {
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    return group;
  }

  async update(id: string, dto: UpdateGroupDto, userId?: string): Promise<Group> {
    // Validate that group exists
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Validate dates if provided
    const departure = dto.departure_date ? new Date(dto.departure_date) : new Date(group.departure_date);
    const returnDate = dto.return_date ? new Date(dto.return_date) : new Date(group.return_date);

    if (returnDate <= departure) {
      throw new BadRequestException('Return date must be after departure date');
    }

    const updated = await this.groupsDao.updateById(id, {
      ...dto,
      updated_by_id: userId,
      updated_at: new Date(),
    } as Partial<Group>);

    return this.groupsDao.findByIdWithJoins(id);
  }

  async remove(id: string, userId?: string): Promise<void> {
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.groupsDao.updateById(id, {
      is_deleted: true,
      deleted_at: new Date(),
      deleted_by_id: userId,
    } as Partial<Group>);
  }

  async getRoomRequests(groupId: string): Promise<RoomRequestWithMembers[]> {
    const group = await this.groupsDao.findByIdWithJoins(groupId);
    if (!group) throw new NotFoundException('Group not found');
    return this.roomRequestsDao.findByGroupId(groupId);
  }

  // ── Members ────────────────────────────────────────────────

  async getGroupMembers(groupId: string, pageIndex = 1, pageSize = 10): Promise<PaginatedResult<any>> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    const { records, total } = await this.groupMembersDao.getGroupMembersWithDetailsPaginated(groupId, pageIndex, pageSize);
    return new PaginatedResult(records, {
      total_items_count: total,
      total_pages_count: Math.ceil(total / pageSize) || 1,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  // ── Rooms ────────────────────────────────────────────────

  async getGroupRooms(groupId: string): Promise<RoomWithMembers[]> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    return this.roomsDao.findByGroupId(groupId);
  }

  // ── Plans ────────────────────────────────────────────────

  async getGroupPlans(groupId: string): Promise<any[]> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    const plans = await this.plansDao.findByGroupId(groupId);
    return Promise.all(plans.map(async (plan) => {
      const procedures = await this.proceduresDao.findByPlanId(plan.id);
      const confirmations = await Promise.all(procedures.map(p => this.confirmationsDao.findByProcedureId(p.id)));
      return {
        ...plan,
        procedures: procedures.map((p, i) => ({ ...p, confirmations: confirmations[i] })),
      };
    }));
  }

  // ── Status ──────────────────────────────────────────────

  async changeStatus(
    id: string,
    status: 'NEW' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
    userId?: string,
  ): Promise<Group> {
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    await this.groupsDao.updateById(id, {
      status,
      updated_by_id: userId,
      updated_at: new Date(),
    } as Partial<Group>);

    return this.groupsDao.findByIdWithJoins(id);
  }
}
