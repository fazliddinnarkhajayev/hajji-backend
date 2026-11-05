import { Inject, Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { PaginatedResult } from '../interfaces/pagination.interface';
import { BaseDao } from './base.dao';

export type UserActivityAction = 'REGISTER' | 'LOGIN';
export type UserActivityMethod = 'SMS' | 'TELEGRAM' | 'GOOGLE' | 'PASSWORD';

export interface UserActivity {
  id: string;
  user_id: string;
  action: UserActivityAction;
  method: UserActivityMethod | null;
  created_at: Date;
}

@Injectable()
export class UserActivityDao extends BaseDao<UserActivity> {
  private readonly logger = new Logger(UserActivityDao.name);

  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.USER_ACTIVITY_LOG, db);
  }

  /**
   * Runs in a savepoint and swallows errors: a log row must never fail a login,
   * and a failed statement would otherwise abort the caller's transaction.
   */
  async record(
    userId: string,
    action: UserActivityAction,
    method: UserActivityMethod | null,
    trx: Knex.Transaction,
  ): Promise<void> {
    try {
      await trx.transaction((savepoint) =>
        savepoint(TABLE_NAMES.USER_ACTIVITY_LOG).insert({ user_id: userId, action, method }),
      );
    } catch (error) {
      this.logger.warn(`Could not log ${action} for user ${userId}: ${error.message}`);
    }
  }

  /** Newest first, with the user's name, phone and current type (PILGRIM splits into GUIDE). */
  async listWithUsers(pageIndex: number = 1, pageSize: number = 10) {
    const [{ count }] = await this.qb().count('* as count');
    const totalItemsCount = Number(count);

    const records = await this.db(`${TABLE_NAMES.USER_ACTIVITY_LOG} as a`)
      .leftJoin(`${TABLE_NAMES.USERS} as u`, 'u.id', 'a.user_id')
      .leftJoin(`${TABLE_NAMES.PILGRIMS} as p`, 'p.user_id', 'a.user_id')
      .leftJoin(`${TABLE_NAMES.ADMINS} as ad`, 'ad.user_id', 'a.user_id')
      .select(
        'a.id',
        'a.user_id',
        'a.action',
        'a.method',
        'a.created_at',
        'u.username',
        this.db.raw(`CASE WHEN p.is_guide THEN 'GUIDE' ELSE u.type END as user_type`),
        this.db.raw('COALESCE(p.first_name, ad.first_name) as first_name'),
        this.db.raw('COALESCE(p.last_name, ad.last_name) as last_name'),
        this.db.raw('COALESCE(p.phone, ad.phone) as phone'),
      )
      .orderBy('a.created_at', 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);

    return new PaginatedResult(records, {
      total_items_count: totalItemsCount,
      total_pages_count: Math.ceil(totalItemsCount / pageSize),
      page_size: pageSize,
      page_index: pageIndex,
    });
  }
}
