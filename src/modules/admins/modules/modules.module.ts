import { Module } from '@nestjs/common';
import { AgenciesModule } from './agencies/agencies.module';
import { PilgrimsModule } from './pilgrims/pilgrims.module';
import { GroupsModule } from './groups/groups.module';

@Module({
  imports: [AgenciesModule, PilgrimsModule, GroupsModule],
  exports: [],
})
export class AdminsModulesModule { }
