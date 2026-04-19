import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsDao } from 'src/shared/dao/invitations.dao';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { PilgrimAgencyHistoryDao } from 'src/shared/dao/pilgrim-agency-history.dao';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsDao, PilgrimsDao, PilgrimAgencyHistoryDao],
  exports: [InvitationsService, InvitationsDao],
})
export class InvitationsModule {}
