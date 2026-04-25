import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';

export interface Group {
  id: string;
  agency_id: string;
  name: string;
  description?: string | null;
  departure_date: Date;
  return_date: Date;
  meeting_point?: string | null;
  guide_pilgrim_id: string;
  status: 'NEW' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_at?: Date;
  created_by_id?: string | null;
  updated_at?: Date;
  updated_by_id?: string | null;
  is_deleted?: boolean;
  deleted_at?: Date | null;
  deleted_by_id?: string | null;
}

@Injectable()
export class GroupsDao extends BaseDao<Group> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.GROUPS, db);
  }

  async findByAgencyId(agencyId: string, trx?: Knex.Transaction): Promise<Group[]> {
    const records = await this.qb(trx)
      .where({ agency_id: agencyId, is_deleted: false })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');
    return records as Group[];
  }

  async findByIdWithDetails(id: string, trx?: Knex.Transaction): Promise<Group | undefined> {
    const record = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.GROUPS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .leftJoin(TABLE_NAMES.PILGRIMS, `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`, `${TABLE_NAMES.PILGRIMS}.id`)
      .select(
        `${TABLE_NAMES.GROUPS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.PILGRIMS}.id, 'full_name', ${TABLE_NAMES.PILGRIMS}.full_name) as guide`),
      )
      .where({ [`${TABLE_NAMES.GROUPS}.id`]: id, [`${TABLE_NAMES.GROUPS}.is_deleted`]: false })
      .whereNull(`${TABLE_NAMES.GROUPS}.deleted_at`)
      .first();

    return record as Group | undefined;
  }

  async findByStatus(status: string, agencyId?: string, trx?: Knex.Transaction): Promise<Group[]> {
    let query = this.qb(trx)
      .where({ status, is_deleted: false })
      .whereNull('deleted_at');

    if (agencyId) {
      query = query.where({ agency_id: agencyId });
    }

    return query.orderBy('created_at', 'desc') as Promise<Group[]>;
  }

  async findByGuideId(guidePilgrimId: string, trx?: Knex.Transaction): Promise<Group[]> {
    const records = await this.qb(trx)
      .where({ guide_pilgrim_id: guidePilgrimId, is_deleted: false })
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc');
    return records as Group[];
  }
}
