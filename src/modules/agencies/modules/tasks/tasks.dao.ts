import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

// ─── Types ────────────────────────────────────────────────────

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Assignment {
  id: string;
  supervisor_id: string;
  manager_id: string;
  agency_id: string;
  created_at?: Date;
}

export interface TaskCategory {
  id: string;
  agency_id: string;
  name: string;
  icon: string;
  color: string;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface Task {
  id: string;
  agency_id: string;
  created_by_id: string;
  assigned_to_id: string;
  category_id?: string | null;
  title: string;
  comment?: string | null;
  scheduled_time?: Date | null;
  location_name?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_radius_meters?: number | null;
  status: TaskStatus;
  completed_at?: Date | null;
  completed_lat?: number | null;
  completed_lng?: number | null;
  completed_comment?: string | null;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  // Joined
  category?: TaskCategory | null;
  assigned_to?: { id: string; first_name: string; last_name?: string; phone: string } | null;
  created_by?: { id: string; first_name: string; last_name?: string } | null;
}

// ─── Assignments DAO ──────────────────────────────────────────

@Injectable()
export class AssignmentsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async assign(supervisorId: string, managerId: string, agencyId: string): Promise<Assignment> {
    const [row] = await this.db(TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS)
      .insert({ supervisor_id: supervisorId, manager_id: managerId, agency_id: agencyId })
      .onConflict(['supervisor_id', 'manager_id']).ignore()
      .returning('*');
    return row as Assignment;
  }

  async unassign(supervisorId: string, managerId: string, agencyId: string): Promise<void> {
    await this.db(TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS)
      .where({ supervisor_id: supervisorId, manager_id: managerId, agency_id: agencyId })
      .delete();
  }

  async findManagersBySupervisor(supervisorId: string): Promise<{ manager_id: string }[]> {
    return this.db(TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS)
      .where({ supervisor_id: supervisorId })
      .select('manager_id');
  }

  async findSupervisorsByManager(managerId: string): Promise<{ supervisor_id: string }[]> {
    return this.db(TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS)
      .where({ manager_id: managerId })
      .select('supervisor_id');
  }

  async getManagersWithDetails(supervisorId: string, agencyId: string): Promise<any[]> {
    return this.db(TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS)
      .join(TABLE_NAMES.AGENCY_USERS, `${TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS}.manager_id`, `${TABLE_NAMES.AGENCY_USERS}.id`)
      .where({
        [`${TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS}.supervisor_id`]: supervisorId,
        [`${TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS}.agency_id`]: agencyId,
        [`${TABLE_NAMES.AGENCY_USERS}.is_deleted`]: false,
      })
      .select(
        `${TABLE_NAMES.AGENCY_USERS}.id`,
        `${TABLE_NAMES.AGENCY_USERS}.first_name`,
        `${TABLE_NAMES.AGENCY_USERS}.last_name`,
        `${TABLE_NAMES.AGENCY_USERS}.phone`,
        `${TABLE_NAMES.AGENCY_USERS}.role`,
        `${TABLE_NAMES.AGENCY_USERS}.status`,
      );
  }

  async isManagedBy(supervisorId: string, managerId: string): Promise<boolean> {
    const row = await this.db(TABLE_NAMES.SUPERVISOR_MANAGER_ASSIGNMENTS)
      .where({ supervisor_id: supervisorId, manager_id: managerId })
      .first();
    return !!row;
  }
}

// ─── Task Categories DAO ──────────────────────────────────────

@Injectable()
export class TaskCategoriesDao extends BaseDao<TaskCategory> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.TASK_CATEGORIES, db);
  }

  async findByAgency(agencyId: string): Promise<TaskCategory[]> {
    return this.qb()
      .where({ agency_id: agencyId, is_deleted: false })
      .whereNull('deleted_at')
      .orderBy('name') as Promise<TaskCategory[]>;
  }
}

// ─── Tasks DAO ────────────────────────────────────────────────

@Injectable()
export class TasksDao extends BaseDao<Task> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.TASKS, db);
  }

  private withJoins(qb: Knex.QueryBuilder): Knex.QueryBuilder {
    return qb
      .leftJoin(
        `${TABLE_NAMES.TASK_CATEGORIES} as cat`,
        `${TABLE_NAMES.TASKS}.category_id`, 'cat.id',
      )
      .leftJoin(
        `${TABLE_NAMES.AGENCY_USERS} as au`,
        `${TABLE_NAMES.TASKS}.assigned_to_id`, 'au.id',
      )
      .select(
        `${TABLE_NAMES.TASKS}.*`,
        this.db.raw(`json_build_object('id', cat.id, 'name', cat.name, 'icon', cat.icon, 'color', cat.color) as category`),
        this.db.raw(`json_build_object('id', au.id, 'first_name', au.first_name, 'last_name', au.last_name, 'phone', au.phone) as assigned_to`),
      );
  }

  async findBySupervisor(supervisorId: string, agencyId: string, pageIndex = 1, pageSize = 20): Promise<{ data: Task[]; total: number }> {
    const base = this.qb().where({
      [`${TABLE_NAMES.TASKS}.created_by_id`]: supervisorId,
      [`${TABLE_NAMES.TASKS}.agency_id`]: agencyId,
      [`${TABLE_NAMES.TASKS}.is_deleted`]: false,
    }).whereNull(`${TABLE_NAMES.TASKS}.deleted_at`);

    const [{ count }] = await base.clone().count('* as count');
    const data = await this.withJoins(base.clone())
      .orderBy(`${TABLE_NAMES.TASKS}.created_at`, 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);

    return { data: data as Task[], total: Number(count) };
  }

  async findByAssignee(managerId: string, agencyId: string, pageIndex = 1, pageSize = 20): Promise<{ data: Task[]; total: number }> {
    const base = this.qb().where({
      [`${TABLE_NAMES.TASKS}.assigned_to_id`]: managerId,
      [`${TABLE_NAMES.TASKS}.agency_id`]: agencyId,
      [`${TABLE_NAMES.TASKS}.is_deleted`]: false,
    }).whereNull(`${TABLE_NAMES.TASKS}.deleted_at`);

    const [{ count }] = await base.clone().count('* as count');
    const data = await this.withJoins(base.clone())
      .orderBy(`${TABLE_NAMES.TASKS}.created_at`, 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);

    return { data: data as Task[], total: Number(count) };
  }

  async findOneWithJoins(id: string): Promise<Task | undefined> {
    const row = await this.withJoins(
      this.qb().where({ [`${TABLE_NAMES.TASKS}.id`]: id, [`${TABLE_NAMES.TASKS}.is_deleted`]: false })
    ).first();
    return row as Task | undefined;
  }
}
