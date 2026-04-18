import { Injectable } from "@nestjs/common";
import { Knex } from "knex";
import { BaseService } from "src/shared/services/base.service";
import { UserTypesEnum } from "src/shared/enums/user-types.enum";
import { UsersService } from "src/modules/users/users.service";
import { Pilgrim, PilgrimsDao } from "src/shared/dao/piligrims.dao";
import { CreatePilgrimDto } from "./dto/create-pilgrim.dto";
import { PaginatedResult } from "src/shared/interfaces/pagination.interface";

@Injectable()
export class PilgrimsService extends BaseService<Pilgrim, PilgrimsDao> {
  constructor(
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly usersService: UsersService,
  ) {
    super(pilgrimsDao);
  }

  async create(dto: CreatePilgrimDto, user: any): Promise<Pilgrim> {
    const run = async (t: Knex.Transaction) => {
      const new_user = await this.usersService.create(
        {
          username: dto.phone,
          type: UserTypesEnum.PILGRIM,
          created_by_id: user.created_by_id,
        } as any,
        t,
      );

      return this.pilgrimsDao.insert(
        {
          first_name: dto.first_name,
          last_name: dto.last_name,
          middle_name: dto.middle_name,
          phone: dto.phone,
          email: dto.email,
          country_id: dto.country_id,
          region_id: dto.region_id,
          district_id: dto.district_id,
          user_id: new_user.id,
        } as Partial<Pilgrim>,
        t,
      );
    };

    return this.transaction(run);
  }

  async findAllPaginated(
    where: Partial<Pilgrim> = {},
    pageIndex: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResult<Pilgrim>> {
    return this.pilgrimsDao.findManyPaginated(where, pageIndex, pageSize);
  }

  async block(id: string) {
    return this.pilgrimsDao.updateById(id, {
      is_blocked: true,
      status: "BLOCKED",
      blocked_at: new Date(),
    } as Partial<Pilgrim>);
  }

  async unblock(id: string) {
    return this.pilgrimsDao.updateById(id, {
      is_blocked: false,
      status: "ACTIVE",
      blocked_at: undefined,
    } as Partial<Pilgrim>);
  }

  async setAgency(id: string, agencyId: string): Promise<Pilgrim | undefined> {
    return this.pilgrimsDao.updateById(id, {
      agency_id: agencyId,
      updated_at: new Date(),
    } as Partial<Pilgrim>);
  }

  async removeAgency(id: string): Promise<Pilgrim | undefined> {
    return this.pilgrimsDao.updateById(id, {
      agency_id: null,
      updated_at: new Date(),
    } as Partial<Pilgrim>);
  }
}
