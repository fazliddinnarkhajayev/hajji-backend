import { Module } from '@nestjs/common';
import { AgenciesModule } from './agencies/agencies.module';
import { PilgrimsModule } from './pilgrims/pilgrims.module';
import { GroupsModule } from './groups/groups.module';
import { ActivitiesModule } from './activities/activities.module';
import { AdminDashboardModule } from './dashboard/dashboard.module';
import { AdminRitualSessionsModule } from './ritual-sessions/ritual-sessions.module';
import { AdminBillingModule } from './billing/billing.module';

@Module({
  imports: [AgenciesModule, PilgrimsModule, GroupsModule, ActivitiesModule, AdminDashboardModule, AdminRitualSessionsModule, AdminBillingModule],
  exports: [],
})
export class AdminsModulesModule { }
