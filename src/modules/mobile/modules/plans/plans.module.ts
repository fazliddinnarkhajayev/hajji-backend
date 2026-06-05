import { Module } from '@nestjs/common';
import { MobilePlansController } from './plans.controller';
import { MobilePlansService } from './plans.service';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao } from 'src/modules/agencies/modules/plans/plans.dao';
import { GroupMembersDao } from 'src/shared/dao/group-members.dao';

@Module({
  controllers: [MobilePlansController],
  providers: [MobilePlansService, PilgrimsDao, GroupPlansDao, PlanProceduresDao, PlanConfirmationsDao, GroupMembersDao],
})
export class MobilePlansModule {}
