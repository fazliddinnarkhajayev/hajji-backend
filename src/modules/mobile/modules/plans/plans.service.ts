import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async confirmProcedure(
    userId: string,
    procedureId: string,
    comment?: string,
  ): Promise<{ success: boolean }> {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim) throw new NotFoundException('Pilgrim profile not found');

    const confirmedByType = (pilgrim.is_guide ? 'GUIDE' : 'PILGRIM') as 'GUIDE' | 'PILGRIM';

    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure) throw new NotFoundException('Procedure not found');

    if (!procedure.requires_confirmation) {
      throw new BadRequestException('This procedure does not require confirmation');
    }

    const cb = procedure.confirmation_by;
    if (cb !== 'BOTH' && cb !== confirmedByType) {
      throw new BadRequestException(`Only ${cb} can confirm this procedure`);
    }

    const existing = await this.confirmationsDao.findByProcedureAndUser(
      procedureId,
      pilgrim.id,
      confirmedByType,
    );
    if (existing) throw new BadRequestException('You have already confirmed this procedure');

    await this.confirmationsDao.insert({
      procedure_id: procedureId,
      confirmed_by_user_id: pilgrim.id,
      confirmed_by_type: confirmedByType,
      comment: comment ?? null,
      confirmed_at: new Date(),
    } as any);

    return { success: true };
  }

  async getGroupMembersForGuide(userId: string, procedureId: string) {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim || !pilgrim.is_guide) throw new BadRequestException('Only guides can view member status');

    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure) throw new NotFoundException('Procedure not found');

    const plan = await this.plansDao.findById(procedure.plan_id);
    if (!plan) throw new NotFoundException('Plan not found');

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
