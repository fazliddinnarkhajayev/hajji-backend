import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsDao } from 'src/modules/admins/modules/groups/groups.dao';
import { SharedModule } from 'src/shared/shared.module';
import { RoomRequestsDao } from 'src/shared/dao/room-requests.dao';
import { RoomsDao } from 'src/shared/dao/rooms.dao';
import { WebSocketModule } from 'src/modules/websocket/websocket.module';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao } from 'src/modules/agencies/modules/plans/plans.dao';

@Module({
  imports: [SharedModule, WebSocketModule],
  providers: [
    GroupsService, GroupsDao, RoomRequestsDao, RoomsDao,
    AgencyUsersDao, GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao,
  ],
  controllers: [GroupsController],
})
export class GroupsModule {}
