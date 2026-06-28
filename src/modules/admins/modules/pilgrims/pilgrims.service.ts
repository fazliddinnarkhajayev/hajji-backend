import { Injectable } from "@nestjs/common";
import { BadRequestException } from "@nestjs/common";
import { Knex } from "knex";
import { BaseService } from "src/shared/services/base.service";
import { UserTypesEnum } from "src/shared/enums/user-types.enum";
import { UsersService } from "src/modules/users/users.service";
import { Pilgrim, PilgrimsDao } from "src/shared/dao/piligrims.dao";
import { PilgrimAgencyHistoryDao } from "src/shared/dao/pilgrim-agency-history.dao";
import { CreatePilgrimDto } from "./dto/create-pilgrim.dto";
import { PaginatedResult } from "src/shared/interfaces/pagination.interface";
import { SundryService } from "src/shared/services/sundry.service";

@Injectable()
export class PilgrimsService extends BaseService<Pilgrim, PilgrimsDao> {
  constructor(
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly historyDao: PilgrimAgencyHistoryDao,
    private readonly usersService: UsersService,
    private readonly sundryService: SundryService,
  ) {
    super(pilgrimsDao);
  }

  async create(dto: CreatePilgrimDto, user: any): Promise<Pilgrim> {
    const run = async (t: Knex.Transaction) => {
      const phone = this.sundryService.normalizePhone(dto.phone);
      const new_user = await this.usersService.create(
        {
          username: phone,
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
          phone: phone,
          email: dto.email,
          country_id: dto.country_id,
          region_id: dto.region_id,
          district_id: dto.district_id,
          pinfl: dto.pinfl,
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

  async setAgency(
    id: string,
    body: { agency_id: string; notes?: string },
    user: any,
  ): Promise<Pilgrim | undefined> {
    const { agency_id: agencyId, notes } = body;
    const userId = user.id;

    // Get current pilgrim to check if agency is already set
    const pilgrim = await this.pilgrimsDao.findById(id);
    if (pilgrim?.agency_id) {
      throw new BadRequestException('Pilgrim already has an agency assigned. Please remove agency first.');
    }

    const updated = await this.pilgrimsDao.updateById(id, {
      agency_id: agencyId,
      updated_at: new Date(),
    } as Partial<Pilgrim>);

    // Log the action to history
    await this.historyDao.createHistory({
      pilgrim_id: id,
      agency_id: agencyId,
      user_id: userId,
      action: 'SET',
      notes: notes || null,
    });

    return updated;
  }

  async removeAgency(
    id: string,
    body: { notes?: string },
    user: any,
  ): Promise<Pilgrim | undefined> {
    const { notes } = body;
    const userId = user.id;

    // Get previous agency_id for history
    const pilgrim = await this.pilgrimsDao.findById(id);
    const previousAgencyId = pilgrim?.agency_id || null;

    const updated = await this.pilgrimsDao.updateById(id, {
      agency_id: null,
      updated_at: new Date(),
    } as Partial<Pilgrim>);

    // Log the action to history
    await this.historyDao.createHistory({
      pilgrim_id: id,
      agency_id: previousAgencyId,
      user_id: userId,
      action: 'REMOVE',
      notes: notes || null,
    });

    return updated;
  }

  async getAgencyHistory(
    pilgrimId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ data: any[]; total: number }> {
    const [history, total] = await Promise.all([
      this.historyDao.getHistoryWithJoins(pilgrimId, limit, offset),
      this.historyDao.countHistoryByPilgrimId(pilgrimId),
    ]);

    return {
      data: history,
      total,
    };
  }
}
