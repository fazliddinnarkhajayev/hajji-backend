import { Module } from '@nestjs/common';
import { ProfileModule } from './profile/profile.module';
import { InvitationsModule } from './invitations/invitations.module';

@Module({
  imports: [ProfileModule, InvitationsModule],
})
export class MobileModulesModule {}
