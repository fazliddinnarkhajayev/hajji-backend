import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsDao } from 'src/shared/dao/invitations.dao';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { PilgrimAgencyHistoryDao } from 'src/shared/dao/pilgrim-agency-history.dao';
import { WebSocketModule } from 'src/modules/websocket/websocket.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [WebSocketModule, NotificationsModule],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsDao, PilgrimsDao, PilgrimAgencyHistoryDao],
  exports: [InvitationsService],
})
export class InvitationsModule {}
