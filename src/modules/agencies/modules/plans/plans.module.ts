import { Module } from '@nestjs/common';
import { GroupPlansController } from './plans.controller';
import { GroupPlansService } from './plans.service';
import { GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao } from './plans.dao';
import { GroupsDao } from 'src/modules/admins/modules/groups/groups.dao';

@Module({
  controllers: [GroupPlansController],
  providers: [GroupPlansService, GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao, GroupsDao],
})
export class GroupPlansModule {}
