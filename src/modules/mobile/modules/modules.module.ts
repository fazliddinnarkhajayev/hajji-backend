import { Module } from '@nestjs/common';
import { ProfileModule } from './profile/profile.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MobilePlansModule } from './plans/plans.module';

@Module({
  imports: [ProfileModule, InvitationsModule, MobilePlansModule],
})
export class MobileModulesModule {}
