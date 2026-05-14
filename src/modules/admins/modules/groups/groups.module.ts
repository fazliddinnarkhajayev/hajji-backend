import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsDao } from 'src/modules/admins/modules/groups/groups.dao';
import { SharedModule } from 'src/shared/shared.module';
import { RoomGroupsDao } from 'src/shared/dao/room-groups.dao';
import { WebSocketModule } from 'src/modules/websocket/websocket.module';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';

@Module({
  imports: [SharedModule, WebSocketModule],
  providers: [GroupsService, GroupsDao, RoomGroupsDao, AgencyUsersDao],
  controllers: [GroupsController],
})
export class GroupsModule {}
