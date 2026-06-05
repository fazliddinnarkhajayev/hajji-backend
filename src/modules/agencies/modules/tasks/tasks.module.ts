import { Module } from '@nestjs/common';
import { AssignmentsController, TaskCategoriesController, TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AssignmentsDao, TaskCategoriesDao, TasksDao } from './tasks.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';

@Module({
  controllers: [AssignmentsController, TaskCategoriesController, TasksController],
  providers: [TasksService, AssignmentsDao, TaskCategoriesDao, TasksDao, AgencyUsersDao],
  exports: [TasksService, AssignmentsDao, TaskCategoriesDao, TasksDao],
})
export class TasksModule {}
