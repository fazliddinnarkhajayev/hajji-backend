import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

export interface AgencyUser {
  id: string;
  agency_id: string;
  user_id: string;
  first_name: string;
  last_name?: string;
  middle_name?: string;
  phone: string;
  role: string;
  status: 'ACTIVE' | 'BLOCKED' | 'DELETED';
  created_at?: Date;
  updated_at?: Date;
  created_by_id?: string;
  updated_by_id?: string;
  is_deleted?: boolean;
}

@Injectable()
export class AgencyUsersDao extends BaseDao<AgencyUser> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.AGENCY_USERS, db);
  }

  async findByAgencyPaginatedWithDetails(
    agencyId: string,
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ) {
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .where({ [`${TABLE_NAMES.AGENCY_USERS}.agency_id`]: agencyId, [`${TABLE_NAMES.AGENCY_USERS}.is_deleted`]: false })
      .whereNull(`${TABLE_NAMES.AGENCY_USERS}.deleted_at`)
      .count('* as count');

    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.USERS, `${TABLE_NAMES.AGENCY_USERS}.user_id`, `${TABLE_NAMES.USERS}.id`)
      .where({ [`${TABLE_NAMES.AGENCY_USERS}.agency_id`]: agencyId, [`${TABLE_NAMES.AGENCY_USERS}.is_deleted`]: false })
      .whereNull(`${TABLE_NAMES.AGENCY_USERS}.deleted_at`)
      .select(
        `${TABLE_NAMES.AGENCY_USERS}.*`,
        `${TABLE_NAMES.USERS}.username`,
      )
      .orderBy(`${TABLE_NAMES.AGENCY_USERS}.created_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    const total = Number(count);

    return {
      data: records as (AgencyUser & { username: string })[],
      meta: {
        total_items_count: total,
        total_pages_count: Math.ceil(total / pageSize) || 1,
        page_size: pageSize,
        page_index: pageIndex,
      },
    };
  }
}
