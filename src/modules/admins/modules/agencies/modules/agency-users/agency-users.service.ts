import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { AgencyUsersDao, AgencyUser } from './agency-users.dao';
import { BaseService } from 'src/shared/services/base.service';
import { CreateAgencyUserDto } from './dto/create-agency-user.dto';
import { UsersService } from 'src/modules/users/users.service';
import { SundryService } from 'src/shared/services/sundry.service';
import { UserTypesEnum } from 'src/shared/enums/user-types.enum';

@Injectable()
export class AgencyUsersService extends BaseService<AgencyUser, AgencyUsersDao> {
  constructor(
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly usersService: UsersService,
    private readonly sundryService: SundryService,
  ) {
    super(agencyUsersDao);
  }

  async findByAgency(agencyId: string, pageIndex: number = 1, pageSize: number = 10) {
    return this.agencyUsersDao.findManyPaginated({ agency_id: agencyId } as Partial<AgencyUser>, pageIndex, pageSize);
  }

  async createAgencyUser(agencyId: string, dto: CreateAgencyUserDto, trx?: Knex.Transaction): Promise<AgencyUser> {
    const run = async (t: Knex.Transaction) => {
      const password_hash = this.sundryService.generateHashPassword(dto.password);

      const user = await this.usersService.create(
        {
          username: dto.username,
          password_hash,
          type: UserTypesEnum.AGENCY_USER,
        },
        t,
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
        } as Partial<AgencyUser>,
        t,
      );
    };

    return trx ? run(trx) : this.transaction(run);
  }
}
