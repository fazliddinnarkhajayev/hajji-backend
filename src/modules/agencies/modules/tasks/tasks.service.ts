import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentsDao, TaskCategoriesDao, TasksDao, TaskActivityLogDao, Task, TaskStatus, TaskStats, TaskActivityAction } from './tasks.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { FlagTaskDto } from './dto/flag-task.dto';
import { ReassignTaskDto } from './dto/reassign-task.dto';
import { ResolveFlagDto } from './dto/resolve-flag.dto';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

// Haversine: distance in meters between two GPS points
function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class TasksService {
  constructor(
    private readonly assignmentsDao: AssignmentsDao,
    private readonly categoriesDao: TaskCategoriesDao,
    private readonly tasksDao: TasksDao,
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly webSocketService: WebSocketService,
    private readonly notificationsService: NotificationsService,
    private readonly taskActivityLogDao: TaskActivityLogDao,
  ) {}

  // ── Activity log ────────────────────────────────────────────

  private async logActivity(
    taskId: string,
    actorId: string,
    action: TaskActivityAction,
    opts: { comment?: string | null; fromStatus?: TaskStatus | null; toStatus?: TaskStatus | null } = {},
  ): Promise<void> {
    await this.taskActivityLogDao.insert({
      task_id: taskId,
      actor_id: actorId,
      action,
      comment: opts.comment ?? null,
      from_status: opts.fromStatus ?? null,
      to_status: opts.toStatus ?? null,
    });
  }

  // ── Realtime ───────────────────────────────────────────────
  // broadcastToUser expects the core users.id, not agency_users.id — resolve it here.
  private async resolveUserId(agencyUserId: string): Promise<string | undefined> {
    const agencyUser = await this.agencyUsersDao.findById(agencyUserId);
    return (agencyUser as any)?.user_id;
  }

  private async emitTaskCreated(task: Task): Promise<void> {
    const userId = await this.resolveUserId(task.assigned_to_id);
    if (!userId) return;
    const message = `New task assigned: "${task.title}"`;
    this.webSocketService.broadcastToUser(userId, 'task_created', {
      type: 'TASK_CREATED',
      task,
      message,
    });
    this.notificationsService.notify(userId, 'TASK_CREATED', 'New task assigned', {
      message,
      subject: task.title,
      link: { screen: 'taskDetail', id: task.id },
    });
  }

  private async emitTaskUpdate(
    task: Task,
    type: string,
    message: string,
    extraAgencyUserIds: string[] = [],
  ): Promise<void> {
    const agencyUserIds = new Set<string>([task.created_by_id, task.assigned_to_id, ...extraAgencyUserIds]);
    const userIds = await Promise.all(
      Array.from(agencyUserIds).map((id) => this.resolveUserId(id)),
    );
    userIds
      .filter((id): id is string => !!id)
      .forEach((userId) => {
        this.webSocketService.broadcastToUser(userId, 'task_updated', { type, task, message });
        this.notificationsService.notify(userId, type, task.title, {
          message,
          subject: task.title,
          link: { screen: 'taskDetail', id: task.id },
        });
      });
  }

  // ── Assignments ────────────────────────────────────────────

  async assignManager(supervisorId: string, managerId: string, agencyId: string) {
    const manager = await this.agencyUsersDao.findOne({ id: managerId, agency_id: agencyId } as any);
    if (!manager) throw new NotFoundException('Manager not found in this agency');
    if ((manager as any).role !== 'MANAGER') throw new BadRequestException('User must have MANAGER role');
    return this.assignmentsDao.assign(supervisorId, managerId, agencyId);
  }

  async unassignManager(supervisorId: string, managerId: string, agencyId: string) {
    await this.assignmentsDao.unassign(supervisorId, managerId, agencyId);
    return { success: true };
  }

  async getMyManagers(supervisorId: string, agencyId: string) {
    return this.assignmentsDao.getManagersWithDetails(supervisorId, agencyId);
  }

  // ── Categories ─────────────────────────────────────────────

  async getCategories(agencyId: string) {
    return this.categoriesDao.findByAgency(agencyId);
  }

  async createCategory(agencyId: string, dto: CreateCategoryDto) {
    return this.categoriesDao.insert({
      agency_id: agencyId,
      name: dto.name,
      icon: dto.icon ?? '📋',
      color: dto.color ?? '#6366f1',
    } as any);
  }

  async deleteCategory(id: string, agencyId: string) {
    const cat = await this.categoriesDao.findOne({ id, agency_id: agencyId } as any);
    if (!cat) throw new NotFoundException('Category not found');
    await this.categoriesDao.deleteById(id);
    return { success: true };
  }

  // ── Tasks ──────────────────────────────────────────────────

  async createTask(supervisorId: string, agencyId: string, dto: CreateTaskDto): Promise<Task> {
    // Verify the manager belongs to this supervisor
    const isAssigned = await this.assignmentsDao.isManagedBy(supervisorId, dto.assigned_to_id);
    if (!isAssigned) throw new ForbiddenException('This manager is not assigned to you');

    const hasLocation = dto.location_lat != null && dto.location_lng != null;

    const created = await this.tasksDao.insert({
      agency_id: agencyId,
      created_by_id: supervisorId,
      assigned_to_id: dto.assigned_to_id,
      category_id: dto.category_id ?? null,
      title: dto.title,
      comment: dto.comment ?? null,
      scheduled_time: dto.scheduled_time ? new Date(dto.scheduled_time) : null,
      location_name: dto.location_name ?? null,
      location_lat: hasLocation ? dto.location_lat : null,
      location_lng: hasLocation ? dto.location_lng : null,
      location_radius_meters: hasLocation ? (dto.location_radius_meters ?? 100) : null,
      status: 'PENDING',
    } as Partial<Task>);

    const task = await this.tasksDao.findOneWithJoins(created.id) as Task;
    await this.logActivity(task.id, supervisorId, 'CREATED', { toStatus: 'PENDING' });
    await this.emitTaskCreated(task);
    return task;
  }

  async getTasksForUser(userId: string, agencyId: string, role: string, page = 1, size = 20, status?: TaskStatus, sort: 'created_at' | 'updated_at' = 'created_at') {
    if (role === 'SUPERVISOR' || role === 'SUPERADMIN') {
      const { data, total } = await this.tasksDao.findBySupervisor(userId, agencyId, page, size, status, sort);
      return new PaginatedResult(data, {
        total_items_count: total,
        total_pages_count: Math.ceil(total / size) || 1,
        page_size: size,
        page_index: page,
      });
    }
    // MANAGER — sees tasks assigned to them
    const { data, total } = await this.tasksDao.findByAssignee(userId, agencyId, page, size, status, sort);
    return new PaginatedResult(data, {
      total_items_count: total,
      total_pages_count: Math.ceil(total / size) || 1,
      page_size: size,
      page_index: page,
    });
  }

  async getTaskStats(userId: string, agencyId: string, role: string): Promise<TaskStats> {
    if (role === 'SUPERVISOR' || role === 'SUPERADMIN') {
      return this.tasksDao.getStats({ created_by_id: userId }, agencyId);
    }
    // MANAGER — stats for tasks assigned to them
    return this.tasksDao.getStats({ assigned_to_id: userId }, agencyId);
  }

  // Backs the home dashboard's "recent tasks" widget — same scoping as
  // getTaskStats, just the most-recently-changed few tasks instead of counts.
  async getRecentTasks(userId: string, agencyId: string, role: string, limit = 3): Promise<Task[]> {
    if (role === 'SUPERVISOR' || role === 'SUPERADMIN') {
      return this.tasksDao.findRecent({ created_by_id: userId }, agencyId, limit);
    }
    return this.tasksDao.findRecent({ assigned_to_id: userId }, agencyId, limit);
  }

  async getTaskById(id: string, agencyId: string): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    task.activity_log = await this.taskActivityLogDao.findByTask(id);
    return task;
  }

  async startTask(id: string, userId: string, agencyId: string): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.assigned_to_id !== userId) throw new ForbiddenException('This task is not assigned to you');
    if (task.status !== 'PENDING') throw new BadRequestException('Only a pending task can be started');

    await this.tasksDao.updateById(id, {
      status: 'IN_PROGRESS',
      started_at: new Date(),
      updated_at: new Date(),
    } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, userId, 'STARTED', { fromStatus: task.status, toStatus: 'IN_PROGRESS' });
    await this.emitTaskUpdate(updated, 'TASK_STARTED', `"${updated.title}" was started`);
    return updated;
  }

  async flagTask(id: string, userId: string, agencyId: string, dto: FlagTaskDto): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.assigned_to_id !== userId) throw new ForbiddenException('This task is not assigned to you');
    if (task.status !== 'IN_PROGRESS') throw new BadRequestException('Only an in-progress task can be flagged');

    await this.tasksDao.updateById(id, {
      status: 'FLAGGED',
      flagged_at: new Date(),
      issue_comment: dto.issue_comment,
      updated_at: new Date(),
    } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, userId, 'FLAGGED', {
      comment: dto.issue_comment,
      fromStatus: task.status,
      toStatus: 'FLAGGED',
    });
    await this.emitTaskUpdate(updated, 'TASK_FLAGGED', `An issue was reported on "${updated.title}"`);
    return updated;
  }

  async completeTask(id: string, userId: string, agencyId: string, dto: CompleteTaskDto): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.assigned_to_id !== userId) throw new ForbiddenException('This task is not assigned to you');
    if (task.status !== 'IN_PROGRESS') throw new BadRequestException('Only an in-progress task can be completed');

    // GPS verification if task has a location
    if (task.location_lat != null && task.location_lng != null) {
      if (dto.completed_lat == null || dto.completed_lng == null) {
        throw new BadRequestException('GPS location is required to complete this task');
      }
      const distance = haversineMeters(
        task.location_lat,
        task.location_lng,
        dto.completed_lat,
        dto.completed_lng,
      );
      const radius = task.location_radius_meters ?? 100;
      if (distance > radius) {
        throw new BadRequestException(
          `You are ${Math.round(distance)} meters away from the required location (max ${radius}m)`,
        );
      }
    }

    await this.tasksDao.updateById(id, {
      status: 'COMPLETED',
      completed_at: new Date(),
      completed_lat: dto.completed_lat ?? null,
      completed_lng: dto.completed_lng ?? null,
      completed_comment: dto.completed_comment ?? null,
      updated_at: new Date(),
    } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, userId, 'COMPLETED', { fromStatus: task.status, toStatus: 'COMPLETED' });
    await this.emitTaskUpdate(updated, 'TASK_COMPLETED', `"${updated.title}" was completed`);
    return updated;
  }

  async cancelTask(id: string, userId: string, agencyId: string): Promise<{ success: boolean }> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.created_by_id !== userId) throw new ForbiddenException('Only the task creator can cancel');
    if (task.status === 'COMPLETED') throw new BadRequestException('Cannot cancel a completed task');
    if (task.status === 'CANCELLED_ON_PROBLEM') throw new BadRequestException('Task is already cancelled');
    await this.tasksDao.updateById(id, { status: 'CANCELLED', updated_at: new Date() } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, userId, 'CANCELLED', { fromStatus: task.status, toStatus: 'CANCELLED' });
    await this.emitTaskUpdate(updated, 'TASK_CANCELLED', `"${updated.title}" was cancelled`);
    return { success: true };
  }

  async reassignTask(id: string, supervisorId: string, agencyId: string, dto: ReassignTaskDto): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.created_by_id !== supervisorId) throw new ForbiddenException('Only the task creator can reassign');
    if (task.status === 'COMPLETED') throw new BadRequestException('Cannot reassign a completed task');
    if (task.status === 'CANCELLED' || task.status === 'CANCELLED_ON_PROBLEM') throw new BadRequestException('Cannot reassign a cancelled task');

    const isAssigned = await this.assignmentsDao.isManagedBy(supervisorId, dto.assigned_to_id);
    if (!isAssigned) throw new ForbiddenException('This manager is not assigned to you');

    const previousAssigneeId = task.assigned_to_id;

    await this.tasksDao.updateById(id, {
      assigned_to_id: dto.assigned_to_id,
      status: 'PENDING',
      started_at: null,
      flagged_at: null,
      issue_comment: null,
      completed_at: null,
      completed_lat: null,
      completed_lng: null,
      completed_comment: null,
      updated_at: new Date(),
    } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, supervisorId, 'REASSIGNED', { fromStatus: task.status, toStatus: 'PENDING' });
    await this.emitTaskUpdate(updated, 'TASK_REASSIGNED', `"${updated.title}" was reassigned`, [previousAssigneeId]);
    return updated;
  }

  async closeTask(id: string, supervisorId: string, agencyId: string): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.created_by_id !== supervisorId) throw new ForbiddenException('Only the task creator can close this task');
    if (task.status === 'COMPLETED') throw new BadRequestException('Task is already completed');
    if (task.status === 'CANCELLED' || task.status === 'CANCELLED_ON_PROBLEM') throw new BadRequestException('Task is cancelled');

    await this.tasksDao.updateById(id, {
      status: 'COMPLETED',
      completed_at: new Date(),
      updated_at: new Date(),
    } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, supervisorId, 'CLOSED', { fromStatus: task.status, toStatus: 'COMPLETED' });
    await this.emitTaskUpdate(updated, 'TASK_CLOSED', `"${updated.title}" was closed`);
    return updated;
  }

  // A flagged task isn't finished — the creator (supervisor/superadmin) must
  // resolve it: either end the task in CANCELLED_ON_PROBLEM, or send it back
  // to CONTINUE so the assignee can resume it themselves via continueTask().
  async resolveFlag(id: string, supervisorId: string, agencyId: string, dto: ResolveFlagDto): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.created_by_id !== supervisorId) throw new ForbiddenException('Only the task creator can resolve a flagged task');
    if (task.status !== 'FLAGGED') throw new BadRequestException('Only a flagged task can be resolved');

    const toStatus: TaskStatus = dto.action === 'cancel' ? 'CANCELLED_ON_PROBLEM' : 'CONTINUE';
    await this.tasksDao.updateById(id, { status: toStatus, updated_at: new Date() } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, supervisorId, dto.action === 'cancel' ? 'CANCELLED_ON_PROBLEM' : 'CONTINUE_APPROVED', {
      comment: dto.comment,
      fromStatus: 'FLAGGED',
      toStatus,
    });
    if (dto.action === 'cancel') {
      await this.emitTaskUpdate(updated, 'TASK_CANCELLED_ON_PROBLEM', `"${updated.title}" was cancelled after a reported issue`);
    } else {
      await this.emitTaskUpdate(updated, 'TASK_CONTINUE_APPROVED', `"${updated.title}" can be resumed`);
    }
    return updated;
  }

  // Assignee resumes a task the creator approved to continue after a flag.
  async continueTask(id: string, userId: string, agencyId: string): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.assigned_to_id !== userId) throw new ForbiddenException('This task is not assigned to you');
    if (task.status !== 'CONTINUE') throw new BadRequestException('This task is not awaiting resumption');

    await this.tasksDao.updateById(id, { status: 'IN_PROGRESS', updated_at: new Date() } as any);

    const updated = await this.tasksDao.findOneWithJoins(id) as Task;
    await this.logActivity(id, userId, 'RESUMED', { fromStatus: 'CONTINUE', toStatus: 'IN_PROGRESS' });
    await this.emitTaskUpdate(updated, 'TASK_RESUMED', `"${updated.title}" was resumed`);
    return updated;
  }
}
