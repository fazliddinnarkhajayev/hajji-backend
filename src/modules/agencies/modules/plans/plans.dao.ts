import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

export type PlanStatus = 'DRAFT' | 'ACTIVE';
export type ConfirmationBy = 'PILGRIM' | 'GUIDE' | 'BOTH';

export interface GroupPlan {
  id: string;
  group_id: string;
  agency_id: string;
  name: string;
  total_days: number;
  description?: string;
  status: PlanStatus;
  start_date?: string | null;  // ISO date "YYYY-MM-DD", day 1 reference
  created_by_id?: string;
  is_deleted?: boolean;
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlanProcedure {
  id: string;
  plan_id: string;
  day_index: number;
  title: string;
  meeting_time: string;
  duration_minutes: number;
  location?: string;
  requires_confirmation: boolean;
  confirmation_by?: ConfirmationBy;
  order_index: number;
  is_deleted?: boolean;
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlanConfirmation {
  id: string;
  procedure_id: string;
  confirmed_by_user_id: string;
  confirmed_by_type: 'PILGRIM' | 'GUIDE';
  comment?: string;
  confirmed_at?: Date;
  is_deleted?: boolean;
  created_at?: Date;
}

// ─── Group Plans DAO ──────────────────────────────────────────

@Injectable()
export class GroupPlansDao extends BaseDao<GroupPlan> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.GROUP_PLANS, db);
  }

  async findByGroupId(groupId: string, trx?: Knex.Transaction): Promise<GroupPlan[]> {
    return this.qb(trx)
      .where({ group_id: groupId, is_deleted: false })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc') as Promise<GroupPlan[]>;
  }
}

// ─── Plan Procedures DAO ──────────────────────────────────────

@Injectable()
export class PlanProceduresDao extends BaseDao<PlanProcedure> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.GROUP_PLAN_PROCEDURES, db);
  }

  async findByPlanId(planId: string, trx?: Knex.Transaction): Promise<PlanProcedure[]> {
    return this.qb(trx)
      .where({ plan_id: planId, is_deleted: false })
      .whereNull('deleted_at')
      .orderBy([{ column: 'day_index', order: 'asc' }, { column: 'order_index', order: 'asc' }]) as Promise<PlanProcedure[]>;
  }

  async countByPlanAndDay(planId: string, dayIndex: number, trx?: Knex.Transaction): Promise<number> {
    const [{ count }] = await this.qb(trx)
      .where({ plan_id: planId, day_index: dayIndex, is_deleted: false })
      .count('* as count');
    return Number(count);
  }
}

// ─── Plan Confirmations DAO ───────────────────────────────────

@Injectable()
export class PlanConfirmationsDao extends BaseDao<PlanConfirmation> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.GROUP_PLAN_CONFIRMATIONS, db);
  }

  async findByProcedureId(procedureId: string, trx?: Knex.Transaction): Promise<PlanConfirmation[]> {
    return this.qb(trx)
      .where({ procedure_id: procedureId, is_deleted: false })
      .orderBy('confirmed_at', 'asc') as Promise<PlanConfirmation[]>;
  }

  async findByProcedureAndUser(
    procedureId: string,
    userId: string,
    userType: 'PILGRIM' | 'GUIDE',
    trx?: Knex.Transaction,
  ): Promise<PlanConfirmation | undefined> {
    const record = await this.qb(trx)
      .where({ procedure_id: procedureId, confirmed_by_user_id: userId, confirmed_by_type: userType, is_deleted: false })
      .first();
    return record as PlanConfirmation | undefined;
  }
}
