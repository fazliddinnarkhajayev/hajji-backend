import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsDao } from 'src/modules/admins/modules/groups/groups.dao';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { RoomRequestsDao } from 'src/shared/dao/room-requests.dao';
import { RoomsDao } from 'src/shared/dao/rooms.dao';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [GroupsService, GroupsDao, WebSocketService, AgencyUsersDao, RoomRequestsDao, RoomsDao],
  controllers: [GroupsController],
})
export class GroupsModule {}
