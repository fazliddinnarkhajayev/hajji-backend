import { Module } from '@nestjs/common';
import { ProfileModule } from './profile/profile.module';
import { InvitationsModule } from './invitations/invitations.module';
import { MobilePlansModule } from './plans/plans.module';
import { MobileDuasModule } from './duas/duas.module';
import { MobileLocationsModule } from './locations/locations.module';
import { MobileRitualsModule } from './rituals/rituals.module';
import { MobileRitualSessionsModule } from './ritual-sessions/ritual-sessions.module';

@Module({
  imports: [
    ProfileModule,
    InvitationsModule,
    MobilePlansModule,
    MobileDuasModule,
    MobileLocationsModule,
    MobileRitualsModule,
    MobileRitualSessionsModule,
  ],
})
export class MobileModulesModule {}
