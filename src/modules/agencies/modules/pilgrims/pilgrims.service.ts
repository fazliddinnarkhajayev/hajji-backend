import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { BaseService } from 'src/shared/services/base.service';
import { PilgrimsDao, Pilgrim } from 'src/shared/dao/piligrims.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { UsersService } from 'src/modules/users/users.service';
import { UserTypesEnum } from 'src/shared/enums/user-types.enum';
import { JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { SundryService } from 'src/shared/services/sundry.service';
import { CreatePilgrimDto } from './dto/create-pilgrim.dto';

@Injectable()
export class AgencyPilgrimsService extends BaseService<Pilgrim, PilgrimsDao> {
  constructor(
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly usersService: UsersService,
    private readonly sundryService: SundryService,
  ) {
    super(pilgrimsDao);
  }

  async create(dto: CreatePilgrimDto, user: any): Promise<Pilgrim> {
    const run = async (t: Knex.Transaction) => {
      const phone = this.sundryService.normalizePhone(dto.phone);
      const newUser = await this.usersService.create(
        {
          username: phone,
          type: UserTypesEnum.PILGRIM,
          created_by_id: user.id,
        } as any,
        t,
      );

      return this.pilgrimsDao.insert(
        {
          first_name: dto.first_name,
          last_name: dto.last_name,
          middle_name: dto.middle_name,
          phone: phone,
          email: dto.email,
          country_id: dto.country_id,
          region_id: dto.region_id,
          district_id: dto.district_id,
          user_id: newUser.id,
          agency_id: user.agency_id,
          pinfl: dto.pinfl,
        } as Partial<Pilgrim>,
        t,
      );
    };

    return this.transaction(run);
  }

  async getAgencyPilgrims(user: any, query: any) {
    const { page = '1', limit = '10', phone, is_guide } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Build filter criteria
    const where: any = { is_deleted: false, agency_id: user.agency_id };

    // Apply is_guide filter if provided
    if (is_guide !== undefined) {
      where.is_guide = is_guide === 'true';
    }

    // Apply phone filter if provided (using ILIKE for case-insensitive partial matching)
    if (phone) {
      const normalizedPhone = this.sundryService.normalizePhone(phone);
      return await this.pilgrimsDao.findManyPaginatedWithPhone(where, normalizedPhone, pageIndex, pageSize);
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

  async setAsGuide(pilgrimId: string, agencyId: string): Promise<any> {
    // Get the pilgrim
    const pilgrim = await this.pilgrimsDao.findById(pilgrimId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }

    // Verify the pilgrim belongs to this agency
    if (pilgrim.agency_id !== agencyId) {
      throw new BadRequestException('Pilgrim does not belong to this agency');
    }

    // Update the pilgrim as guide
    return this.pilgrimsDao.updateById(pilgrimId, {
      is_guide: true,
      updated_at: new Date(),
    } as Partial<Pilgrim>);
  }

  async removeAsGuide(pilgrimId: string, agencyId: string): Promise<any> {
    // Get the pilgrim
    const pilgrim = await this.pilgrimsDao.findById(pilgrimId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }

    // Verify the pilgrim belongs to this agency
    if (pilgrim.agency_id !== agencyId) {
      throw new BadRequestException('Pilgrim does not belong to this agency');
    }

    // Update the pilgrim to remove guide status
    return this.pilgrimsDao.updateById(pilgrimId, {
      is_guide: false,
      updated_at: new Date(),
    } as Partial<Pilgrim>);
  }

  async searchPilgrimsByPhoneOrPinfl(query: any) {
    const { page = '1', limit = '10', search } = query;
    if (!search) {
      return await this.pilgrimsDao.findManyPaginated({ is_deleted: false }, 1, 10);
    }
    const normalized = this.sundryService.normalizePhone(search);
    return await this.pilgrimsDao.searchByPhoneOrPinfl(normalized, parseInt(page, 10), parseInt(limit, 10));
  }

  async getGuides(user: any, query: any) {
    const { page = '1', limit = '10', has_group } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Get guides for this agency
    const where: any = { is_deleted: false, agency_id: user.agency_id, is_guide: true };
    
    // Apply has_group filter if provided
    if (has_group !== undefined) {
      const hasGroupBool = has_group === 'true';
      return await this.pilgrimsDao.findGuidesPaginatedWithGroupFilter(where, pageIndex, pageSize, hasGroupBool);
    }
    
    return await this.pilgrimsDao.findManyPaginated(where, pageIndex, pageSize);
  }
}
