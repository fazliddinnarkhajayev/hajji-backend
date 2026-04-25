import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';
import { PaginatedResult } from '../interfaces/pagination.interface';

import { InvitationStatus } from 'src/modules/agencies/modules/invitations/enums/invitation-status.enum';

export interface Invitation {
  id: string;
  pilgrim_id: string;
  agency_id: string;
  created_by_id: string;
  status: InvitationStatus;
  message?: string | null;
  expires_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  deleted_by_id?: string | null;
  // Joined data
  pilgrim?: {
    id?: string;
    first_name?: string;
    last_name?: string | null;
  };
  agency?: {
    id?: string;
    name?: string;
  };
  user?: {
    id?: string;
    username?: string;
  };
}

@Injectable()
export class InvitationsDao extends BaseDao<Invitation> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.INVITATIONS, db);
  }

  async findById(
    id: string,
    trx?: Knex.Transaction,
  ): Promise<Invitation | undefined> {
    const record = await this.qb(trx)
      .where({ [`${this.tableName}.id`]: id })
      .leftJoin(
        TABLE_NAMES.PILGRIMS,
        `${this.tableName}.pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .leftJoin(
        TABLE_NAMES.AGENCIES,
        `${this.tableName}.agency_id`,
        `${TABLE_NAMES.AGENCIES}.id`,
      )
      .leftJoin(
        TABLE_NAMES.USERS,
        `${this.tableName}.created_by_id`,
        `${TABLE_NAMES.USERS}.id`,
      )
      .select(
        `${this.tableName}.*`,
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.PILGRIMS}"."id",
            'first_name', "${TABLE_NAMES.PILGRIMS}"."first_name",
            'last_name', "${TABLE_NAMES.PILGRIMS}"."last_name"
          ) as pilgrim
        `),
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.AGENCIES}"."id",
            'name', "${TABLE_NAMES.AGENCIES}"."name"
          ) as agency
        `),
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.USERS}"."id",
            'username', "${TABLE_NAMES.USERS}"."username"
          ) as user
        `),
      )
      .first();

    return record as Invitation | undefined;
  }

  async findManyPaginated(
    where: Partial<Invitation> = {},
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ): Promise<PaginatedResult<Invitation>> {
    const offset = (pageIndex - 1) * pageSize;

    // Build where clause with qualified column names
    const qualifiedWhere: Record<string, unknown> = {};
    Object.entries(where).forEach(([key, value]) => {
      qualifiedWhere[`${this.tableName}.${key}`] = value;
    });
    qualifiedWhere[`${this.tableName}.is_deleted`] = false;

    // Get count with soft delete filters
    const [{ count }] = await this.qb(trx)
      .where(qualifiedWhere)
      .whereNull(`${this.tableName}.deleted_at`)
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    // Get records with joins
    const records = await this.qb(trx)
      .where(qualifiedWhere)
      .whereNull(`${this.tableName}.deleted_at`)
      .leftJoin(
        TABLE_NAMES.PILGRIMS,
        `${this.tableName}.pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .leftJoin(
        TABLE_NAMES.AGENCIES,
        `${this.tableName}.agency_id`,
        `${TABLE_NAMES.AGENCIES}.id`,
      )
      .leftJoin(
        TABLE_NAMES.USERS,
        `${this.tableName}.created_by_id`,
        `${TABLE_NAMES.USERS}.id`,
      )
      .select(
        `${this.tableName}.*`,
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.PILGRIMS}"."id",
            'first_name', "${TABLE_NAMES.PILGRIMS}"."first_name",
            'last_name', "${TABLE_NAMES.PILGRIMS}"."last_name"
          ) as pilgrim
        `),
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.AGENCIES}"."id",
            'name', "${TABLE_NAMES.AGENCIES}"."name"
          ) as agency
        `),
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.USERS}"."id",
            'username', "${TABLE_NAMES.USERS}"."username"
          ) as user
        `),
      )
      .orderBy(`${this.tableName}.created_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as Invitation[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }
}
