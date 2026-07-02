import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrentUser } from 'src/shared/decorators';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';
import { FlagTaskDto } from './dto/flag-task.dto';
import { ReassignTaskDto } from './dto/reassign-task.dto';
import { ResolveFlagDto } from './dto/resolve-flag.dto';
import { ListTasksDto } from './dto/list-tasks.dto';

// ── Assignments ────────────────────────────────────────────────
@Controller('agencies/assignments')
export class AssignmentsController {
  constructor(private readonly service: TasksService) {}

  // supervisor_id ixtiyoriy: SUPERADMIN boshqa supervisor uchun qo'sha oladi
  @Post()
  assign(@Body() dto: AssignManagerDto, @CurrentUser() user: any) {
    const supervisorId = dto.supervisor_id ?? user.agencyUser.id;
    return this.service.assignManager(supervisorId, dto.manager_id, user.agency_id);
  }

  @Delete(':managerId')
  unassign(
    @Param('managerId') managerId: string,
    @Query('supervisor_id') supervisorId: string | undefined,
    @CurrentUser() user: any,
  ) {
    return this.service.unassignManager(supervisorId ?? user.agencyUser.id, managerId, user.agency_id);
  }

  // Joriy foydalanuvchining managerlar ro'yxati (supervisor o'zi uchun)
  @Get('my-managers')
  getMyManagers(@CurrentUser() user: any) {
    return this.service.getMyManagers(user.agencyUser.id, user.agency_id);
  }

  // Istalgan supervisor managerlarini ko'rish (SUPERADMIN uchun)
  @Get('supervisor/:supervisorId/managers')
  getSupervisorManagers(
    @Param('supervisorId') supervisorId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getMyManagers(supervisorId, user.agency_id);
  }
}

// ── Task Categories ────────────────────────────────────────────
@Controller('agencies/task-categories')
export class TaskCategoriesController {
  constructor(private readonly service: TasksService) {}

  @Get()
  list(@CurrentUser() user: any) {
    return this.service.getCategories(user.agency_id);
  }

  @Post()
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: any) {
    return this.service.createCategory(user.agency_id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteCategory(id, user.agency_id);
  }
}

// ── Tasks ──────────────────────────────────────────────────────
@Controller('agencies/tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    return this.service.createTask(user.agencyUser.id, user.agency_id, dto);
  }

  @Get()
  list(@Query() query: ListTasksDto, @CurrentUser() user: any) {
    return this.service.getTasksForUser(
      user.agencyUser.id,
      user.agency_id,
      user.role,
      query.page_index,
      query.page_size,
      query.status,
      query.sort,
    );
  }

  // Must come before ':id' — otherwise Nest would route 'stats' into the :id param.
  @Get('stats')
  stats(@CurrentUser() user: any) {
    return this.service.getTaskStats(user.agencyUser.id, user.agency_id, user.role);
  }

  // Must come before ':id' too, for the same reason as 'stats'.
  @Get('recent')
  recent(@Query('limit') limit: string | undefined, @CurrentUser() user: any) {
    const n = limit ? parseInt(limit, 10) : 3;
    return this.service.getRecentTasks(user.agencyUser.id, user.agency_id, user.role, Number.isFinite(n) && n > 0 ? n : 3);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getTaskById(id, user.agency_id);
  }

  @Patch(':id/start')
  start(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.startTask(id, user.agencyUser.id, user.agency_id);
  }

  @Patch(':id/flag')
  flag(
    @Param('id') id: string,
    @Body() dto: FlagTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.service.flagTask(id, user.agencyUser.id, user.agency_id, dto);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.service.completeTask(id, user.agencyUser.id, user.agency_id, dto);
  }

  // creator: resolve a flagged task — either end it (cancel) or approve resuming it (continue)
  @Patch(':id/resolve-flag')
  resolveFlag(
    @Param('id') id: string,
    @Body() dto: ResolveFlagDto,
    @CurrentUser() user: any,
  ) {
    return this.service.resolveFlag(id, user.agencyUser.id, user.agency_id, dto);
  }

  // assignee: resume a task after the creator approved continuing past a flag
  @Patch(':id/continue')
  continue(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.continueTask(id, user.agencyUser.id, user.agency_id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.cancelTask(id, user.agencyUser.id, user.agency_id);
  }

  // supervisor: reassign to a different manager they supervise
  @Patch(':id/reassign')
  reassign(
    @Param('id') id: string,
    @Body() dto: ReassignTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.service.reassignTask(id, user.agencyUser.id, user.agency_id, dto);
  }

  // supervisor: force-close a task (e.g. after resolving a flagged issue)
  @Patch(':id/close')
  close(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.closeTask(id, user.agencyUser.id, user.agency_id);
  }
}
