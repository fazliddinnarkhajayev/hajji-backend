import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao,
  GroupPlan, PlanProcedure,
} from './plans.dao';
import { GroupsDao } from 'src/modules/admins/modules/groups/groups.dao';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';

@Injectable()
export class GroupPlansService {
  constructor(
    private readonly plansDao: GroupPlansDao,
    private readonly proceduresDao: PlanProceduresDao,
    private readonly confirmationsDao: PlanConfirmationsDao,
    private readonly groupsDao: GroupsDao,
  ) {}

  // ── Helpers ────────────────────────────────────────────────

  private async verifyGroupOwnership(groupId: string, agencyId: string): Promise<void> {
    const group = await this.groupsDao.findById(groupId);
    if (!group) throw new NotFoundException('Group not found');
    if (group.agency_id !== agencyId) throw new NotFoundException('Group not found for this agency');
  }

  private async verifyPlanOwnership(planId: string, agencyId: string): Promise<GroupPlan> {
    const plan = await this.plansDao.findById(planId);
    if (!plan) throw new NotFoundException('Plan not found');
    if (plan.agency_id !== agencyId) throw new NotFoundException('Plan not found for this agency');
    return plan;
  }

  // ── Plans ──────────────────────────────────────────────────

  async getPlansForGroup(groupId: string, agencyId: string) {
    await this.verifyGroupOwnership(groupId, agencyId);

    const plans = await this.plansDao.findByGroupId(groupId);

    // Attach procedures to each plan, grouped by day
    return Promise.all(plans.map(async (plan) => {
      const procedures = await this.proceduresDao.findByPlanId(plan.id);
      const confirmations = await Promise.all(
        procedures.map(p => this.confirmationsDao.findByProcedureId(p.id))
      );
      const proceduresWithConfirmations = procedures.map((p, idx) => ({
        ...p,
        confirmations: confirmations[idx],
      }));
      return { ...plan, procedures: proceduresWithConfirmations };
    }));
  }

  async createPlan(groupId: string, agencyId: string, userId: string, dto: CreatePlanDto) {
    await this.verifyGroupOwnership(groupId, agencyId);
    return this.plansDao.insert({
      group_id: groupId,
      agency_id: agencyId,
      name: dto.name,
      total_days: dto.total_days,
      description: dto.description,
      start_date: dto.start_date ?? null,
      status: 'DRAFT',
      created_by_id: userId,
    } as Partial<GroupPlan>);
  }

  async updatePlan(planId: string, agencyId: string, dto: { name?: string; total_days?: number; description?: string; start_date?: string }) {
    const plan = await this.verifyPlanOwnership(planId, agencyId);
    const payload: Partial<GroupPlan> = {};
    if (dto.name !== undefined) payload.name = dto.name;
    if (dto.total_days !== undefined) payload.total_days = dto.total_days;
    if (dto.description !== undefined) payload.description = dto.description;
    if (dto.start_date !== undefined) payload.start_date = dto.start_date;
    return this.plansDao.updateById(planId, payload);
  }

  async deletePlan(planId: string, agencyId: string) {
    await this.verifyPlanOwnership(planId, agencyId);
    await this.plansDao.deleteById(planId);
    return { success: true };
  }

  // ── Procedures ─────────────────────────────────────────────

  async createProcedure(planId: string, agencyId: string, dto: CreateProcedureDto) {
    const plan = await this.verifyPlanOwnership(planId, agencyId);

    if (dto.day_index > plan.total_days) {
      throw new BadRequestException(`day_index cannot exceed plan total_days (${plan.total_days})`);
    }

    if (dto.requires_confirmation && !dto.confirmation_by) {
      throw new BadRequestException('confirmation_by is required when requires_confirmation is true');
    }

    const orderIndex = await this.proceduresDao.countByPlanAndDay(planId, dto.day_index);

    return this.proceduresDao.insert({
      plan_id: planId,
      day_index: dto.day_index,
      title: dto.title,
      meeting_time: dto.meeting_time,
      duration_minutes: dto.duration_minutes,
      location: dto.location,
      requires_confirmation: dto.requires_confirmation,
      confirmation_by: dto.requires_confirmation ? dto.confirmation_by : null,
      order_index: orderIndex,
    } as Partial<PlanProcedure>);
  }

  async updateProcedure(procedureId: string, agencyId: string, dto: UpdateProcedureDto) {
    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure) throw new NotFoundException('Procedure not found');

    await this.verifyPlanOwnership(procedure.plan_id, agencyId);

    const payload: Partial<PlanProcedure> = {};
    if (dto.title !== undefined) payload.title = dto.title;
    if (dto.meeting_time !== undefined) payload.meeting_time = dto.meeting_time;
    if (dto.duration_minutes !== undefined) payload.duration_minutes = dto.duration_minutes;
    if (dto.location !== undefined) payload.location = dto.location;
    if (dto.requires_confirmation !== undefined) {
      payload.requires_confirmation = dto.requires_confirmation;
      if (!dto.requires_confirmation) payload.confirmation_by = undefined;
    }
    if (dto.confirmation_by !== undefined) payload.confirmation_by = dto.confirmation_by;

    return this.proceduresDao.updateById(procedureId, payload);
  }

  async deleteProcedure(procedureId: string, agencyId: string) {
    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure) throw new NotFoundException('Procedure not found');
    await this.verifyPlanOwnership(procedure.plan_id, agencyId);
    await this.proceduresDao.deleteById(procedureId);
    return { success: true };
  }

  // ── Confirmations ──────────────────────────────────────────

  async confirmProcedure(
    procedureId: string,
    agencyId: string,
    userId: string,
    confirmedByType: 'PILGRIM' | 'GUIDE',
    comment?: string,
  ) {
    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure) throw new NotFoundException('Procedure not found');
    await this.verifyPlanOwnership(procedure.plan_id, agencyId);

    if (!procedure.requires_confirmation) {
      throw new BadRequestException('This procedure does not require confirmation');
    }

    const allowed = procedure.confirmation_by;
    if (allowed === 'PILGRIM' && confirmedByType !== 'PILGRIM') {
      throw new BadRequestException('Only pilgrims can confirm this procedure');
    }
    if (allowed === 'GUIDE' && confirmedByType !== 'GUIDE') {
      throw new BadRequestException('Only guides can confirm this procedure');
    }

    const existing = await this.confirmationsDao.findByProcedureAndUser(procedureId, userId, confirmedByType);
    if (existing) throw new BadRequestException('You have already confirmed this procedure');

    return this.confirmationsDao.insert({
      procedure_id: procedureId,
      confirmed_by_user_id: userId,
      confirmed_by_type: confirmedByType,
      comment: comment || null,
      confirmed_at: new Date(),
    } as any);
  }

  async getProcedureConfirmations(procedureId: string, agencyId: string) {
    const procedure = await this.proceduresDao.findById(procedureId);
    if (!procedure) throw new NotFoundException('Procedure not found');
    await this.verifyPlanOwnership(procedure.plan_id, agencyId);
    return this.confirmationsDao.findByProcedureId(procedureId);
  }
}
