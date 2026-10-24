import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';
import { GroupStatus, docsIncompleteCountSql, effectiveStatusSql, membersCountSql } from 'src/shared/dao/group-status';

export interface GroupListFilters {
  /** Effective status (see shared/dao/group-status.ts). */
  status?: GroupStatus;
  /** Case-insensitive part of the group name. */
  q?: string;
}

const G = TABLE_NAMES.GROUPS;

export interface Group {
  id: string;
  agency_id: string;
  name: string;
  description?: string;
  departure_date: Date;
  return_date: Date;
  meeting_point?: string;
  guide_pilgrim_id: string;
  /** Stored: FORMING | CANCELLED. Returned by the *WithJoins reads: the effective status. */
  status?: GroupStatus;
  created_at?: Date;
  updated_at?: Date;
  created_by_id?: string;
  updated_by_id?: string;
  is_deleted?: boolean;
  // Joined data
  members_count?: number;
  /** Members whose visa or ticket is not ISSUED yet. */
  docs_incomplete_count?: number;
  agency?: {
    id?: string;
    name?: string;
  };
  guide_pilgrim?: {
    id?: string;
    first_name?: string;
    last_name?: string;
  };
}

@Injectable()
export class GroupsDao extends BaseDao<Group> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.GROUPS, db);
  }

  async findByIdWithJoins(id: string, trx?: Knex.Transaction): Promise<Group | undefined> {
    const record = await this.qb(trx)
      .leftJoin(
        TABLE_NAMES.AGENCIES,
        `${TABLE_NAMES.GROUPS}.agency_id`,
        `${TABLE_NAMES.AGENCIES}.id`,
      )
      .leftJoin(
        TABLE_NAMES.PILGRIMS,
        `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .select(
        `${TABLE_NAMES.GROUPS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.PILGRIMS}.id, 'first_name', ${TABLE_NAMES.PILGRIMS}.first_name, 'last_name', ${TABLE_NAMES.PILGRIMS}.last_name) as guide_pilgrim`),
        ...this.derivedColumns(),
      )
      .where({ [`${TABLE_NAMES.GROUPS}.id`]: id, [`${TABLE_NAMES.GROUPS}.is_deleted`]: false })
      .first();

    return record as Group | undefined;
  }

  /** members_count, docs_incomplete_count and the effective status (overrides the stored one). */
  private derivedColumns() {
    return [
      this.db.raw(`${membersCountSql(G)} as members_count`),
      this.db.raw(`${docsIncompleteCountSql(G)} as docs_incomplete_count`),
      this.db.raw(`${effectiveStatusSql(G)} as status`),
    ];
  }

  private applyFilters(builder: Knex.QueryBuilder, filters: GroupListFilters) {
    if (filters.status) builder.whereRaw(`${effectiveStatusSql(G)} = ?`, [filters.status]);
    if (filters.q && filters.q.trim()) builder.where(`${G}.name`, 'ilike', `%${filters.q.trim()}%`);
  }

  /** One row per group of the agency with what the status cards need. */
  async findStatsRows(agencyId: string, trx?: Knex.Transaction): Promise<Array<{
    id: string; name: string; departure_date: Date; return_date: Date;
    status: GroupStatus; members_count: number; docs_incomplete_count: number;
  }>> {
    return this.qb(trx)
      .select(`${G}.id`, `${G}.name`, `${G}.departure_date`, `${G}.return_date`, ...this.derivedColumns())
      .where({ [`${G}.agency_id`]: agencyId, [`${G}.is_deleted`]: false })
      .whereNull(`${G}.deleted_at`);
  }

  async findManyPaginatedWithJoins(
    where: Partial<Group> = {},
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
    filters: GroupListFilters = {},
  ) {
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .leftJoin(
        TABLE_NAMES.AGENCIES,
        `${TABLE_NAMES.GROUPS}.agency_id`,
        `${TABLE_NAMES.AGENCIES}.id`,
      )
      .leftJoin(
        TABLE_NAMES.PILGRIMS,
        `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .where((builder) => {
        Object.entries(where).forEach(([key, value]) => {
          if (key !== 'is_deleted') {
            builder.where(`${TABLE_NAMES.GROUPS}.${key}`, value);
          }
        });
        builder.where(`${TABLE_NAMES.GROUPS}.is_deleted`, false);
        this.applyFilters(builder, filters);
      })
      .whereNull(`${TABLE_NAMES.GROUPS}.deleted_at`)
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    const records = await this.qb(trx)
      .leftJoin(
        TABLE_NAMES.AGENCIES,
        `${TABLE_NAMES.GROUPS}.agency_id`,
        `${TABLE_NAMES.AGENCIES}.id`,
      )
      .leftJoin(
        TABLE_NAMES.PILGRIMS,
        `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .select(
        `${TABLE_NAMES.GROUPS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.PILGRIMS}.id, 'first_name', ${TABLE_NAMES.PILGRIMS}.first_name, 'last_name', ${TABLE_NAMES.PILGRIMS}.last_name) as guide_pilgrim`),
        ...this.derivedColumns(),
      )
      .where((builder) => {
        Object.entries(where).forEach(([key, value]) => {
          if (key !== 'is_deleted') {
            builder.where(`${TABLE_NAMES.GROUPS}.${key}`, value);
          }
        });
        builder.where(`${TABLE_NAMES.GROUPS}.is_deleted`, false);
        this.applyFilters(builder, filters);
      })
      .whereNull(`${TABLE_NAMES.GROUPS}.deleted_at`)
      .orderBy(`${TABLE_NAMES.GROUPS}.created_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as Group[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }
}
