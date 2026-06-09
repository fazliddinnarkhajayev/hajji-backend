import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CurrentUser } from 'src/shared/decorators';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { CompleteTaskDto } from './dto/complete-task.dto';

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
  list(@Query() pagination: PaginationDto, @CurrentUser() user: any) {
    return this.service.getTasksForUser(
      user.agencyUser.id,
      user.agency_id,
      user.role,
      pagination.page_index,
      pagination.page_size,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.getTaskById(id, user.agency_id);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() dto: CompleteTaskDto,
    @CurrentUser() user: any,
  ) {
    return this.service.completeTask(id, user.agencyUser.id, user.agency_id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.cancelTask(id, user.agencyUser.id, user.agency_id);
  }
}
