import { Injectable } from "@nestjs/common";
import { Knex } from "knex";
import { BaseService } from "../../shared/services/base.service";
import { AdminsDao } from "../../shared/dao/admins.dao";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { SundryService } from "src/shared/services/sundry.service";
import { UserTypesEnum } from "src/shared/enums/user-types.enum";
import { UsersService } from "../users/users.service";

@Injectable()
export class AdminsService extends BaseService<any, AdminsDao> {
  constructor(
    readonly adminsDao: AdminsDao,
    private readonly usersService: UsersService,
    private readonly sundryService: SundryService,
  ) {
    super(adminsDao);
  }

  async create(dto: CreateAdminDto, trx?: Knex.Transaction): Promise<any> {
    const run = async (t: Knex.Transaction) => {
      const password_hash = this.sundryService.generateHashPassword(dto.password);

      const userData = {
        username: dto.username,
        password_hash: password_hash,
        type: UserTypesEnum.ADMIN,
      };

      const user = await this.usersService.create(userData, t);

      const adminUser: any = {
        phone: this.sundryService.normalizePhone(dto.phone),
        role: dto.role,
        first_name: dto.first_name,
        last_name: dto.last_name,
        middle_name: dto.middle_name,
        user_id: user.id,
      };
      return this.adminsDao.insert(adminUser, t);
    };

    return trx ? run(trx) : this.transaction(run);
  }

  async block(id: string, isBlocked: boolean): Promise<any> {}
}
