import { Module } from '@nestjs/common';
import { AgencyProfileModule } from './profile/profile.module';
import { AgencyPilgrimsModule } from './pilgrims/pilgrims.module';
import { InvitationsModule } from './invitations/invitations.module';
import { GroupsModule } from './groups/groups.module';
import { AgencyUsersManagementModule } from './users/users.module';

@Module({
  imports: [AgencyProfileModule, AgencyPilgrimsModule, InvitationsModule, GroupsModule, AgencyUsersManagementModule],
})
export class AgencyModulesModule {}
