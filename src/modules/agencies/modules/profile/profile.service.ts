import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { AgenciesDao } from 'src/modules/admins/modules/agencies/agencies.dao';
import { JwtPayload } from 'src/shared/guards/jwt-auth.guard';

@Injectable()
export class AgencyProfileService {
  constructor(
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly agenciesDao: AgenciesDao,
  ) {}

  async getProfile(user: any) {
    // Get agency user to find agency_id
    const agencyUser = await this.agencyUsersDao.findOne(
      { user_id: user.id, is_deleted: false },
    );
    if (!agencyUser) {
      throw new NotFoundException('Agency user not found');
    }

    // Get agency details using agency_id
    const agency = await this.agenciesDao.findOne(
      { id: agencyUser.agency_id, is_deleted: false },
    );
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    return agency;
  }

  async updateProfile(user: any, data: Partial<any>) {
    // Get agency user to find agency_id
    const agencyUser = await this.agencyUsersDao.findOne(
      { user_id: user.id, is_deleted: false },
    );
    if (!agencyUser) {
      throw new NotFoundException('Agency user not found');
    }

    // Update agency details using agency_id
    const agency = await this.agenciesDao.findOne(
      { id: agencyUser.agency_id, is_deleted: false },
    );
    if (!agency) {
      throw new NotFoundException('Agency not found');
    }

    const updated = await this.agenciesDao.updateById(agency.id, data);
    if (!updated) {
      throw new BadRequestException('Failed to update agency profile');
    }
    return updated;
  }
}
