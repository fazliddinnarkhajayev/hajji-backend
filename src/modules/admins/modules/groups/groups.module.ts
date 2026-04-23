import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsDao } from './groups.dao';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';

@Module({
  providers: [GroupsService, GroupsDao, WebSocketService, AgencyUsersDao],
  controllers: [GroupsController],
})
export class GroupsModule {}
