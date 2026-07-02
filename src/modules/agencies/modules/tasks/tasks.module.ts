import { Module } from '@nestjs/common';
import { AssignmentsController, TaskCategoriesController, TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AssignmentsDao, TaskCategoriesDao, TasksDao, TaskActivityLogDao } from './tasks.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { WebSocketModule } from 'src/modules/websocket/websocket.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [WebSocketModule, NotificationsModule],
  controllers: [AssignmentsController, TaskCategoriesController, TasksController],
  providers: [TasksService, AssignmentsDao, TaskCategoriesDao, TasksDao, AgencyUsersDao, TaskActivityLogDao],
  exports: [TasksService, AssignmentsDao, TaskCategoriesDao, TasksDao],
})
export class TasksModule {}
