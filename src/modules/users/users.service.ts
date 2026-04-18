import {
  Injectable,
  Inject,
} from '@nestjs/common';
import { UsersDao } from './users.dao';
import { Users } from './users.interface';
import { BaseService } from 'src/shared/services/base.service';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { AdminsDao } from 'src/shared/dao/admins.dao';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { UserTypesEnum } from 'src/shared/enums/user-types.enum';
import { TABLE_NAMES } from 'src/shared/constants/table-names';


@Injectable()
export class UsersService extends BaseService<Users, UsersDao> {
  constructor(
    readonly usersDao: UsersDao,
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly adminsDao: AdminsDao,
    @Inject(KNEX_CONNECTION) private readonly db: Knex,
  ) {
    super(usersDao);
  }

  async getCurrentUser(userId: string): Promise<any> {
    const user = await this.usersDao.findById(userId);
    if (!user) {
      return null;
    }

    const result: any = {
      id: user.id,
      username: user.username,
      type: user.type,
      created_at: user.created_at,
    };

    // If pilgrim, fetch pilgrim details with agency
    if (user.type === UserTypesEnum.PILGRIM) {
      const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
      if (pilgrim) {
        result.pilgrim = pilgrim;
        result.agency = pilgrim.agency;
      }
    }

    // If admin, fetch admin details
    if (user.type === UserTypesEnum.ADMIN) {
      const admin = await this.adminsDao.findOne({ user_id: userId });
      if (admin) {
        result.admin = admin;
      }
    }

    // If agency user, fetch agency user details using raw knex query
    if (user.type === UserTypesEnum.AGENCY_USER) {
      const agencyUser = await this.db(TABLE_NAMES.AGENCY_USERS)
        .where({ user_id: userId, is_deleted: false })
        .whereNull('deleted_at')
        .first();
      
      if (agencyUser) {
        result.agencyUser = agencyUser;
        result.agency_id = agencyUser.agency_id;
      }
    }

    return result;
  }
}
