import { Module } from '@nestjs/common';
import { AgenciesModule } from './agencies/agencies.module';
import { PilgrimsModule } from './pilgrims/pilgrims.module';
import { GroupsModule } from './groups/groups.module';
import { ActivitiesModule } from './activities/activities.module';

@Module({
  imports: [AgenciesModule, PilgrimsModule, GroupsModule, ActivitiesModule],
  exports: [],
})
export class AdminsModulesModule { }
