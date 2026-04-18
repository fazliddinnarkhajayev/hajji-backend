import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BaseService } from 'src/shared/services/base.service';
import { PilgrimsDao, Pilgrim } from 'src/shared/dao/piligrims.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { JwtPayload } from 'src/shared/guards/jwt-auth.guard';

@Injectable()
export class AgencyPilgrimsService extends BaseService<Pilgrim, PilgrimsDao> {
  constructor(
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly agencyUsersDao: AgencyUsersDao,
  ) {
    super(pilgrimsDao);
  }

  async getAgencyPilgrims(user: any, pageIndex: number = 1, pageSize: number = 10) {

    // Fetch all pilgrims with pagination
    // Note: Currently there's no direct agency_id in pilgrims table
    // This can be extended to filter by agency_id once the relationship is properly set up
    const pilgrims = await this.pilgrimsDao.findManyPaginated(
      { is_deleted: false, agency_id: user.agency_id } as any,
      pageIndex,
      pageSize,
    );
    return pilgrims;
  }

  async getPilgrimDetails(userId: string) {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }
    return pilgrim;
  }
}
