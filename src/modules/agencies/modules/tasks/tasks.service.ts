import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AssignmentsDao, TaskCategoriesDao, TasksDao, Task } from './tasks.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';

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
  ) {}

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

    return this.tasksDao.insert({
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
  }

  async getTasksForUser(userId: string, agencyId: string, role: string, page = 1, size = 20) {
    if (role === 'SUPERVISOR' || role === 'SUPERADMIN') {
      const { data, total } = await this.tasksDao.findBySupervisor(userId, agencyId, page, size);
      return new PaginatedResult(data, {
        total_items_count: total,
        total_pages_count: Math.ceil(total / size) || 1,
        page_size: size,
        page_index: page,
      });
    }
    // MANAGER — sees tasks assigned to them
    const { data, total } = await this.tasksDao.findByAssignee(userId, agencyId, page, size);
    return new PaginatedResult(data, {
      total_items_count: total,
      total_pages_count: Math.ceil(total / size) || 1,
      page_size: size,
      page_index: page,
    });
  }

  async getTaskById(id: string, agencyId: string): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    return task;
  }

  async completeTask(id: string, userId: string, agencyId: string, dto: CompleteTaskDto): Promise<Task> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.assigned_to_id !== userId) throw new ForbiddenException('This task is not assigned to you');
    if (task.status === 'COMPLETED') throw new BadRequestException('Task is already completed');
    if (task.status === 'CANCELLED') throw new BadRequestException('Task is cancelled');

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

    return this.tasksDao.findOneWithJoins(id) as Promise<Task>;
  }

  async cancelTask(id: string, userId: string, agencyId: string): Promise<{ success: boolean }> {
    const task = await this.tasksDao.findOneWithJoins(id);
    if (!task || task.agency_id !== agencyId) throw new NotFoundException('Task not found');
    if (task.created_by_id !== userId) throw new ForbiddenException('Only the task creator can cancel');
    if (task.status === 'COMPLETED') throw new BadRequestException('Cannot cancel a completed task');
    await this.tasksDao.updateById(id, { status: 'CANCELLED', updated_at: new Date() } as any);
    return { success: true };
  }
}
