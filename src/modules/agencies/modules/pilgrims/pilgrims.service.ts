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

  async getAgencyPilgrims(user: any, query: any) {
    const { page = '1', limit = '10', phone } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Build filter criteria
    const where: any = { is_deleted: false, agency_id: user.agency_id };

    // Apply phone filter if provided (using ILIKE for case-insensitive partial matching)
    if (phone) {
      return await this.pilgrimsDao.findManyPaginatedWithPhone(where, phone, pageIndex, pageSize);
    }

    // Fetch all pilgrims without phone filter
    return await this.pilgrimsDao.findManyPaginated(where, pageIndex, pageSize);
  }

  async getPilgrimDetails(userId: string) {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }
    return pilgrim;
  }
}
