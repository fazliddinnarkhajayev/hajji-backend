import { Injectable, NotFoundException } from '@nestjs/common';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { UsersService } from 'src/modules/users/users.service';
import { SundryService } from 'src/shared/services/sundry.service';
import { UserTypesEnum } from 'src/shared/enums/user-types.enum';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { CreateAgencyUserDto } from './dto/create-agency-user.dto';
import { UpdateAgencyUserDto } from './dto/update-agency-user.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

@Injectable()
export class AgencyUsersManagementService {
  constructor(
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly usersService: UsersService,
    private readonly sundryService: SundryService,
  ) {}

  async findAll(agencyId: string, pagination: PaginationDto) {
    const { data, meta } = await this.agencyUsersDao.findByAgencyPaginatedWithDetails(
      agencyId,
      pagination.page_index ?? 1,
      pagination.page_size ?? 10,
    );
    return new PaginatedResult(data, meta);
  }

  async create(agencyId: string, dto: CreateAgencyUserDto) {
    return this.agencyUsersDao.transaction(async (trx) => {
      const password_hash = this.sundryService.generateHashPassword(dto.password);

      const user = await this.usersService.create(
        {
          username: dto.username,
          password_hash,
          type: UserTypesEnum.AGENCY_USER,
        },
        trx,
      );

      return this.agencyUsersDao.insert(
        {
          agency_id: agencyId,
          user_id: user.id,
          first_name: dto.first_name,
          last_name: dto.last_name,
          middle_name: dto.middle_name,
          phone: this.sundryService.normalizePhone(dto.phone),
          role: dto.role,
          status: 'ACTIVE',
        } as any,
        trx,
      );
    });
  }

  async update(agencyId: string, userId: string, dto: UpdateAgencyUserDto) {
    const user = await this.agencyUsersDao.findOne({ id: userId, agency_id: agencyId } as any);
    if (!user) throw new NotFoundException('User not found');

    const payload: any = {};
    if (dto.first_name !== undefined) payload.first_name = dto.first_name;
    if (dto.last_name !== undefined) payload.last_name = dto.last_name;
    if (dto.middle_name !== undefined) payload.middle_name = dto.middle_name;
    if (dto.phone !== undefined) payload.phone = this.sundryService.normalizePhone(dto.phone);
    if (dto.role !== undefined) payload.role = dto.role;

    return this.agencyUsersDao.updateById(userId, payload);
  }

  async changeStatus(agencyId: string, userId: string, status: 'ACTIVE' | 'BLOCKED') {
    const user = await this.agencyUsersDao.findOne({ id: userId, agency_id: agencyId } as any);
    if (!user) throw new NotFoundException('User not found');
    return this.agencyUsersDao.updateById(userId, { status } as any);
  }

  async remove(agencyId: string, userId: string) {
    const user = await this.agencyUsersDao.findOne({ id: userId, agency_id: agencyId } as any);
    if (!user) throw new NotFoundException('User not found');
    await this.agencyUsersDao.deleteById(userId);
    return { success: true };
  }
}
