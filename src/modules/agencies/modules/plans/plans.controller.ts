import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GroupPlansService } from './plans.service';
import { CurrentUser } from 'src/shared/decorators';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateProcedureDto } from './dto/create-procedure.dto';
import { UpdateProcedureDto } from './dto/update-procedure.dto';
import { ConfirmProcedureDto } from './dto/confirm-procedure.dto';

@Controller('agencies/groups/:groupId/plans')
export class GroupPlansController {
  constructor(private readonly service: GroupPlansService) {}

  // ── Plans ──────────────────────────────────────────────────

  @Get()
  getPlans(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.service.getPlansForGroup(groupId, user.agency_id);
  }

  @Post()
  createPlan(
    @Param('groupId') groupId: string,
    @Body() dto: CreatePlanDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createPlan(groupId, user.agency_id, user.user_id, dto);
  }

  @Patch(':planId')
  updatePlan(
    @Param('planId') planId: string,
    @Body() dto: UpdatePlanDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updatePlan(planId, user.agency_id, dto);
  }

  @Delete(':planId')
  deletePlan(@Param('planId') planId: string, @CurrentUser() user: any) {
    return this.service.deletePlan(planId, user.agency_id);
  }

  // ── Procedures ─────────────────────────────────────────────

  @Post(':planId/procedures')
  createProcedure(
    @Param('planId') planId: string,
    @Body() dto: CreateProcedureDto,
    @CurrentUser() user: any,
  ) {
    return this.service.createProcedure(planId, user.agency_id, dto);
  }

  @Patch(':planId/procedures/:procedureId')
  updateProcedure(
    @Param('procedureId') procedureId: string,
    @Body() dto: UpdateProcedureDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateProcedure(procedureId, user.agency_id, dto);
  }

  @Delete(':planId/procedures/:procedureId')
  deleteProcedure(
    @Param('procedureId') procedureId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.deleteProcedure(procedureId, user.agency_id);
  }

  // ── Confirmations ──────────────────────────────────────────

  @Post(':planId/procedures/:procedureId/confirm')
  confirmProcedure(
    @Param('procedureId') procedureId: string,
    @Body() dto: ConfirmProcedureDto,
    @CurrentUser() user: any,
  ) {
    return this.service.confirmProcedure(
      procedureId,
      user.agency_id,
      user.user_id,
      dto.confirmed_by_type,
      dto.comment,
    );
  }

  @Get(':planId/procedures/:procedureId/confirmations')
  getConfirmations(
    @Param('procedureId') procedureId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getProcedureConfirmations(procedureId, user.agency_id);
  }
}
