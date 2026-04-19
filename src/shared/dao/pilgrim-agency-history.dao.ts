import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';

export interface PilgrimAgencyHistory {
  id: string;
  pilgrim_id: string;
  agency_id?: string | null;
  user_id: string;
  action: 'SET' | 'REMOVE';
  notes?: string | null;
  created_at?: Date;
  // Joined data
  pilgrim?: {
    id?: string;
    first_name?: string;
    last_name?: string | null;
  };
  agency?: {
    id?: string;
    name?: string;
  } | null;
  user?: {
    id?: string;
    username?: string;
  };
}

@Injectable()
export class PilgrimAgencyHistoryDao extends BaseDao<PilgrimAgencyHistory> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.PILGRIM_AGENCY_HISTORY, db);
  }

  async createHistory(
    data: Omit<PilgrimAgencyHistory, 'id' | 'created_at'>,
    trx?: Knex.Transaction,
  ): Promise<PilgrimAgencyHistory> {
    const [record] = await this.qb(trx).insert(data).returning('*');
    return record as PilgrimAgencyHistory;
  }

  async getHistoryByPilgrimId(
    pilgrimId: string,
    limit: number = 50,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<PilgrimAgencyHistory[]> {
    return this.qb(trx)
      .where({ pilgrim_id: pilgrimId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getHistoryByAgencyId(
    agencyId: string,
    limit: number = 50,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<PilgrimAgencyHistory[]> {
    return this.qb(trx)
      .where({ agency_id: agencyId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getHistoryByAdminId(
    adminId: string,
    limit: number = 50,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<PilgrimAgencyHistory[]> {
    return this.qb(trx)
      .where({ admin_id: adminId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getHistoryByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<PilgrimAgencyHistory[]> {
    return this.qb(trx)
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getHistoryWithJoins(
    pilgrimId: string,
    limit: number = 50,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<PilgrimAgencyHistory[]> {
    return this.qb(trx)
      .where({ pilgrim_id: pilgrimId })
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
        `${this.tableName}.user_id`,
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
      .limit(limit)
      .offset(offset);
  }

  async countHistoryByPilgrimId(pilgrimId: string, trx?: Knex.Transaction): Promise<number> {
    const result = await this.qb(trx)
      .where({ pilgrim_id: pilgrimId })
      .count('* as count')
      .first();
    return result?.count || 0;
  }
}
