import { Module } from '@nestjs/common';
import { AgencyProfileModule } from './profile/profile.module';
import { AgencyPilgrimsModule } from './pilgrims/pilgrims.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [AgencyProfileModule, AgencyPilgrimsModule, InvitationsModule],
})
export class AgencyModulesModule {}
