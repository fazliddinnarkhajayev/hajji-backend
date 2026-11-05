import { Injectable } from '@nestjs/common';
import { UserActivityDao } from 'src/shared/dao/user-activity.dao';

@Injectable()
export class ActivitiesService {
  constructor(private readonly activities: UserActivityDao) {}

  findAllPaginated(pageIndex?: number, pageSize?: number) {
    return this.activities.listWithUsers(pageIndex, pageSize);
  }
}
