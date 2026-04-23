import { Injectable, NotFoundException } from '@nestjs/common';
import { GroupsDao, Group } from 'src/modules/admins/modules/groups/groups.dao';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';

@Injectable()
export class GroupsService {
  constructor(private readonly groupsDao: GroupsDao) {}

  async findByAgency(
    agencyId: string,
    pageIndex: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResult<Group>> {
    return this.groupsDao.findManyPaginatedWithJoins(
      { agency_id: agencyId } as Partial<Group>,
      pageIndex,
      pageSize,
    );
  }

  async findOne(id: string, agencyId: string): Promise<Group> {
    const group = await this.groupsDao.findByIdWithJoins(id);
    if (!group) {
      throw new NotFoundException('Group not found');
    }
    if (group.agency_id !== agencyId) {
      throw new NotFoundException('Group not found for this agency');
    }
    return group;
  }
}
