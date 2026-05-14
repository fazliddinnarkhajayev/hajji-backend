import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsDao } from 'src/modules/admins/modules/groups/groups.dao';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { RoomGroupsDao } from 'src/shared/dao/room-groups.dao';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [GroupsService, GroupsDao, WebSocketService, AgencyUsersDao, RoomGroupsDao],
  controllers: [GroupsController],
})
export class GroupsModule {}
