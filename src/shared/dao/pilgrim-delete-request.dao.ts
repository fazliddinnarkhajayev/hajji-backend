import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';
import { PaginatedResult } from '../interfaces/pagination.interface';

export interface PilgrimDeleteRequest {
  id: string;
  pilgrim_id: string;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
  reviewed_by_id?: string | null;
  reviewed_at?: Date | null;
  created_at?: Date;
  created_by_id?: string | null;
  updated_at?: Date;
  updated_by_id?: string | null;
  is_deleted?: boolean;
  // Joined data
  pilgrim?: {
    id?: string;
    first_name?: string;
    last_name?: string | null;
    middle_name?: string | null;
    phone?: string | null;
    pinfl?: string | null;
  } | null;
}

@Injectable()
export class PilgrimDeleteRequestDao extends BaseDao<PilgrimDeleteRequest> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.PILGRIM_DELETE_REQUESTS, db);
  }

  /** The pilgrim's current active (PENDING, non-deleted) request, if any. */
  async findActiveByPilgrimId(
    pilgrimId: string,
    trx?: Knex.Transaction,
  ): Promise<PilgrimDeleteRequest | undefined> {
    const record = await this.qb(trx)
      .where({ pilgrim_id: pilgrimId, status: 'PENDING', is_deleted: false })
      .whereNull('deleted_at')
      .first();
    return record as PilgrimDeleteRequest | undefined;
  }

  /** A single PENDING (non-deleted) request by id — used by admin approve. */
  async findByIdActive(
    id: string,
    trx?: Knex.Transaction,
  ): Promise<PilgrimDeleteRequest | undefined> {
    const record = await this.qb(trx)
      .where({ id, status: 'PENDING', is_deleted: false })
      .whereNull('deleted_at')
      .first();
    return record as PilgrimDeleteRequest | undefined;
  }

  /**
   * Paginated list of ALL requests (PENDING acted-on ones plus CANCELLED /
   * APPROVED history), joined to the requesting pilgrim. PENDING first, then
   * newest-first, so actionable requests stay on top while history is retained.
   */
  async findPaginated(
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ): Promise<PaginatedResult<PilgrimDeleteRequest>> {
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .where({ [`${this.tableName}.is_deleted`]: false })
      .whereNull(`${this.tableName}.deleted_at`)
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.PILGRIMS, `${this.tableName}.pilgrim_id`, `${TABLE_NAMES.PILGRIMS}.id`)
      .select(
        `${this.tableName}.*`,
        this.db.raw(`json_build_object(
          'id', ${TABLE_NAMES.PILGRIMS}.id,
          'first_name', ${TABLE_NAMES.PILGRIMS}.first_name,
          'last_name', ${TABLE_NAMES.PILGRIMS}.last_name,
          'middle_name', ${TABLE_NAMES.PILGRIMS}.middle_name,
          'phone', ${TABLE_NAMES.PILGRIMS}.phone,
          'pinfl', ${TABLE_NAMES.PILGRIMS}.pinfl
        ) as pilgrim`),
      )
      .where({ [`${this.tableName}.is_deleted`]: false })
      .whereNull(`${this.tableName}.deleted_at`)
      .orderByRaw(`CASE WHEN ${this.tableName}.status = 'PENDING' THEN 0 ELSE 1 END`)
      .orderBy(`${this.tableName}.created_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as PilgrimDeleteRequest[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }
}
