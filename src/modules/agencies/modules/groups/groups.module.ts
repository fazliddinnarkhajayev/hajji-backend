import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupsDao } from 'src/modules/admins/modules/groups/groups.dao';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  providers: [GroupsService, GroupsDao],
  controllers: [GroupsController],
})
export class GroupsModule {}
