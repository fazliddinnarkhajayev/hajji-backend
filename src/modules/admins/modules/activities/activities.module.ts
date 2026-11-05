import { Module } from '@nestjs/common';
import { UserActivityDao } from 'src/shared/dao/user-activity.dao';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';

@Module({
  providers: [ActivitiesService, UserActivityDao],
  controllers: [ActivitiesController],
})
export class ActivitiesModule {}
