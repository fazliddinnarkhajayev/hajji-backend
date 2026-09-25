import { createHash } from 'crypto';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import {
  GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao,
  GroupPlan, PlanProcedure, PlanConfirmation,
} from 'src/modules/agencies/modules/plans/plans.dao';
import { GroupMembersDao } from 'src/shared/dao/group-members.dao';

export interface MobilePlanResponse {
  plan: GroupPlan & { procedures: (PlanProcedure & { confirmations: PlanConfirmation[] })[] };
  plan_started: boolean;   // false when start_date is not set
  current_day: number | null;
  today_complete: boolean;
  is_guide: boolean;
  start_date: string | null;
  today_procedures: (PlanProcedure & { confirmations: PlanConfirmation[] })[];
  tomorrow_procedures: (PlanProcedure & { confirmations: PlanConfirmation[] })[] | null;
}

/** Full plan for offline use (GET /mobile/plans/offline). */
export interface MobileOfflinePlanResponse {
  plan: {
    id: string;
    name: string;
    description: string | null;
    total_days: number;
    start_date: string | null;
    procedures: {
      id: string;
      day_index: number;
      order_index: number;
      title: string;
      meeting_time: string;
      duration_minutes: number;
      location: string | null;
      requires_confirmation: boolean;
      confirmation_by: string | null;
      confirmations: {
        id: string;
        confirmed_by_user_id: string;
        confirmed_by_type: 'PILGRIM' | 'GUIDE';
        comment: string | null;
        confirmed_at: string | null;
      }[];
    }[];
  } | null;
  reason: 'NO_GROUP' | 'NO_PLAN' | null;
  is_guide: boolean;
  /** Pilgrim id of the caller; matches `confirmed_by_user_id`. */
  me: string;
  /** Changes whenever anything in the payload changes. */
  version: string;
}

/** Offline confirmations may be replayed late, but never from the future. */
const CONFIRM_CLOCK_SKEW_MS = 5 * 60 * 1000;

const PG_UNIQUE_VIOLATION = '23505';

/** Date column → "YYYY-MM-DD" (pg returns DATE as a local-midnight Date). */
function toYMD(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(value).slice(0, 10);
}

const toIso = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;

@Injectable()
export class MobilePlansService {
  constructor(
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly plansDao: GroupPlansDao,
    private readonly proceduresDao: PlanProceduresDao,
    private readonly confirmationsDao: PlanConfirmationsDao,
    private readonly groupMembersDao: GroupMembersDao,
  ) {}

  private calcCurrentDay(startDate: string | Date, localDateStr?: string): number {
    // Normalize start_date to YYYYMMDD integer (timezone-safe, pure arithmetic)
    let startYMD: string;
    if (startDate instanceof Date) {
      const y = startDate.getFullYear();
      const m = String(startDate.getMonth() + 1).padStart(2, '0');
      const d = String(startDate.getDate()).padStart(2, '0');
      startYMD = `${y}-${m}-${d}`;
    } else {
      startYMD = String(startDate).slice(0, 10);
    }

    // Today YYYY-MM-DD
    let todayYMD: string;
    if (localDateStr && /^\d{4}-\d{2}-\d{2}/.test(localDateStr)) {
      todayYMD = localDateStr.slice(0, 10);
    } else {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      todayYMD = `${y}-${m}-${d}`;
    }

    const [sy, sm, sd] = startYMD.split('-').map(Number);
    const [ty, tm, td] = todayYMD.split('-').map(Number);

     const startMs = Date.UTC(sy, sm - 1, sd);
    const todayMs  = Date.UTC(ty, tm - 1, td);
    const diffDays = Math.round((todayMs - startMs) / 86400000);
    const result   = Math.max(1, diffDays + 1);

    console.log(`[Plans] start=${startYMD} today=${todayYMD} diff=${diffDays} day=${result}`);
    return result;
  }

  private async getProceduresWithConfirmations(
    planId: string,
    dayIndex: number,
  ): Promise<(PlanProcedure & { confirmations: PlanConfirmation[] })[]> {
    const all = await this.proceduresDao.findByPlanId(planId);
    const dayProcs = all.filter(p => p.day_index === dayIndex);
    return Promise.all(
      dayProcs.map(async (p) => ({
        ...p,
        confirmations: await this.confirmationsDao.findByProcedureId(p.id),
      })),
    );
  }

  private isTodayComplete(
    procedures: (PlanProcedure & { confirmations: PlanConfirmation[] })[],
  ): boolean {
    const confirmRequired = procedures.filter(p => p.requires_confirmation && p.confirmation_by);
    if (confirmRequired.length === 0) return true;

    return confirmRequired.every(p => {
      const confs = p.confirmations ?? [];
      if (p.confirmation_by === 'BOTH') {
        return confs.some(c => c.confirmed_by_type === 'PILGRIM') &&
               confs.some(c => c.confirmed_by_type === 'GUIDE');
      }
      return confs.some(c => c.confirmed_by_type === p.confirmation_by);
    });
  }

  async getCurrentPlan(userId: string, localDate?: string): Promise<MobilePlanResponse> {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim) throw new NotFoundException('Pilgrim profile not found');

    const groupMembership = await this.groupMembersDao.findByPilgrimId(pilgrim.id);
    if (!groupMembership) throw new NotFoundException('You are not assigned to any group');

    const groupId = groupMembership.group_id;
    const plans = await this.plansDao.findByGroupId(groupId);
    if (!plans.length) throw new NotFoundException('No plan found for your group');

    // Prefer plan with start_date, fall back to first plan
    const plan = plans.find(p => p.start_date) ?? plans[0];
    const isGuide = pilgrim.is_guide ?? false;

    // Plan exists but start_date not set yet — return without day data
    if (!plan.start_date) {
      return {
        plan: { ...plan, procedures: [] } as any,
        plan_started: false,
        current_day: null,
        today_complete: false,
        is_guide: isGuide,
        start_date: null,
        today_procedures: [],
        tomorrow_procedures: null,
      };
    }

    const currentDay = this.calcCurrentDay(plan.start_date, localDate);
    const todayProcs = await this.getProceduresWithConfirmations(plan.id, currentDay);
    const todayComplete = this.isTodayComplete(todayProcs);
    const tomorrowProcs = todayComplete
      ? await this.getProceduresWithConfirmations(plan.id, currentDay + 1)
      : null;

    return {
      plan: { ...plan, procedures: todayProcs } as any,
      plan_started: true,
      current_day: currentDay,
      today_complete: todayComplete,
      is_guide: isGuide,
      start_date: plan.start_date,
      today_procedures: todayProcs,
      tomorrow_procedures: tomorrowProcs,
    };
  }

  /** Resolves the caller's pilgrim row and group id (null when not in a group). */
  private async resolveMember(userId: string) {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim) throw new NotFoundException('Pilgrim profile not found');
    const membership = await this.groupMembersDao.findByPilgrimId(pilgrim.id);
    return { pilgrim, groupId: membership?.group_id ?? null };
  }

  /** Same choice as getCurrentPlan: prefer a plan with start_date. */
  private async pickPlan(groupId: string): Promise<GroupPlan | null> {
    const plans = await this.plansDao.findByGroupId(groupId);
    return plans.find(p => p.start_date) ?? plans[0] ?? null;
  }

  /** Throws unless the procedure belongs to a live plan of `groupId`. */
  private async assertProcedureInGroup(procedure: PlanProcedure, groupId: string | null): Promise<GroupPlan> {
    const plan = await this.plansDao.findById(procedure.plan_id);
    if (!plan || plan.is_deleted || !groupId || plan.group_id !== groupId) {
      throw new ForbiddenException('This procedure is not in your group plan');
    }
    return plan;
  }

  private version(body: object): string {
    return createHash('sha1').update(JSON.stringify(body)).digest('hex');
  }

  /**
   * The whole plan (every day) with confirmations, for the app to store and
   * show offline. "No group" / "no plan" are states, not errors.
   */
  async getOfflinePlan(userId: string): Promise<MobileOfflinePlanResponse> {
    const { pilgrim, groupId } = await this.resolveMember(userId);
    const base = { is_guide: pilgrim.is_guide ?? false, me: pilgrim.id };

    const plan = groupId ? await this.pickPlan(groupId) : null;
    if (!plan) {
      const body = { ...base, plan: null, reason: groupId ? ('NO_PLAN' as const) : ('NO_GROUP' as const) };
      return { ...body, version: this.version(body) };
    }

    const procedures = await this.proceduresDao.findByPlanId(plan.id);
    const confirmations = await this.confirmationsDao.findByProcedureIds(procedures.map(p => p.id));
    const byProcedure = new Map<string, PlanConfirmation[]>();
    for (const c of confirmations) {
      const list = byProcedure.get(c.procedure_id) ?? [];
      list.push(c);
      byProcedure.set(c.procedure_id, list);
    }

    const body = {
      ...base,
      reason: null,
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description ?? null,
        total_days: plan.total_days,
        start_date: toYMD(plan.start_date),
        procedures: procedures.map(p => ({
          id: p.id,
          day_index: p.day_index,
          order_index: p.order_index,
          title: p.title,
          meeting_time: p.meeting_time,
          duration_minutes: p.duration_minutes,
          location: p.location ?? null,
          requires_confirmation: !!p.requires_confirmation,
          confirmation_by: p.confirmation_by ?? null,
          confirmations: (byProcedure.get(p.id) ?? []).map(c => ({
            id: c.id,
            confirmed_by_user_id: c.confirmed_by_user_id,
            confirmed_by_type: c.confirmed_by_type,
            comment: c.comment ?? null,
            confirmed_at: toIso(c.confirmed_at),
          })),
        })),
      },
    };
    return { ...body, version: this.version(body) };
  }

  /** Guide: the group roster once (confirmations already come with the plan). */
  async getGroupRoster(userId: string) {
    const { pilgrim, groupId } = await this.resolveMember(userId);
    if (!pilgrim.is_guide) throw new ForbiddenException('Only guides can view the group roster');
    if (!groupId) return { members: [] };
    const members = await this.groupMembersDao.getGroupMembersWithDetailsPaginated(groupId, 1, 500);
    return {
      members: members.records.map(m => ({
        pilgrim_id: m.pilgrim_id,
        full_name: m.full_name,
        phone: m.phone ?? null,
      })),
    };
  }

  async confirmProcedure(
    userId: string,
    procedureId: string,
    comment?: string,
    confirmedAt?: string,
  ): Promise<{ success: boolean; already?: boolean }> {
    const { pilgrim, groupId } = await this.resolveMember(userId);

    const confirmedByType = (pilgrim.is_guide ? 'GUIDE' : 'PILGRIM') as 'GUIDE' | 'PILGRIM';

    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure || procedure.is_deleted) throw new NotFoundException('Procedure not found');
    await this.assertProcedureInGroup(procedure, groupId);

    if (!procedure.requires_confirmation) {
      throw new BadRequestException('This procedure does not require confirmation');
    }

    const cb = procedure.confirmation_by;
    if (cb !== 'BOTH' && cb !== confirmedByType) {
      throw new BadRequestException(`Only ${cb} can confirm this procedure`);
    }

    // Offline confirmations arrive late: keep the device time, never a future one.
    let at = new Date();
    if (confirmedAt) {
      const clientAt = new Date(confirmedAt);
      if (Number.isNaN(clientAt.getTime()) || clientAt.getTime() > Date.now() + CONFIRM_CLOCK_SKEW_MS) {
        throw new BadRequestException('confirmed_at is invalid');
      }
      at = clientAt;
    }

    // Idempotent: the app may replay the same confirmation.
    const existing = await this.confirmationsDao.findByProcedureAndUser(
      procedureId,
      pilgrim.id,
      confirmedByType,
    );
    if (existing) return { success: true, already: true };

    try {
      await this.confirmationsDao.insert({
        procedure_id: procedureId,
        confirmed_by_user_id: pilgrim.id,
        confirmed_by_type: confirmedByType,
        comment: comment ?? null,
        confirmed_at: at,
      } as any);
    } catch (e: any) {
      // Lost a race with a concurrent replay (unique index, migration 048).
      if (e?.code === PG_UNIQUE_VIOLATION) return { success: true, already: true };
      throw e;
    }

    return { success: true };
  }

  async getGroupMembersForGuide(userId: string, procedureId: string) {
    const { pilgrim, groupId } = await this.resolveMember(userId);
    if (!pilgrim.is_guide) throw new BadRequestException('Only guides can view member status');

    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure) throw new NotFoundException('Procedure not found');

    const plan = await this.assertProcedureInGroup(procedure, groupId);

    const members = await this.groupMembersDao.getGroupMembersWithDetailsPaginated(plan.group_id, 1, 500);
    const confirmations = await this.confirmationsDao.findByProcedureId(procedureId);

    const confirmedIds = new Set(confirmations.map(c => c.confirmed_by_user_id));

    return {
      procedure,
      members: members.records.map(m => ({
        ...m,
        confirmed: confirmedIds.has(m.pilgrim_id),
        confirmation: confirmations.find(c => c.confirmed_by_user_id === m.pilgrim_id) ?? null,
      })),
      confirmations,
    };
  }
}
