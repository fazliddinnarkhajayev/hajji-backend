import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

export interface Location {
  id: string;
  name: string;
  name_ar: string;
  description?: string;
  emoji?: string;
  coords: [number, number] | string;
  category?: string | null;
  sort_order?: number | null;
  created_at?: Date;
  updated_at?: Date;
  created_by_id?: string;
  updated_by_id?: string;
  is_deleted?: boolean;
}

@Injectable()
export class LocationsDao extends BaseDao<Location> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.LOCATIONS, db);
  }

  /** All locations in stable content order (for full offline download). */
  findAllOrdered(trx?: Knex.Transaction): Promise<Location[]> {
    return this.qb(trx)
      .where({ is_deleted: false })
      .whereNull('deleted_at')
      .orderByRaw('sort_order asc nulls last')
      .orderBy('created_at', 'asc') as unknown as Promise<Location[]>;
  }

  async insert(data: Partial<Location>, trx?: Knex.Transaction) {
    // Ensure coords is stored as JSON string
    const processedData = {
      ...data,
      coords: typeof data.coords === 'string' ? data.coords : JSON.stringify(data.coords),
    };
    return super.insert(processedData, trx);
  }

  async updateById(id: string, data: Partial<Location>, trx?: Knex.Transaction) {
    const processedData = {
      ...data,
      ...(data.coords && {
        coords: typeof data.coords === 'string' ? data.coords : JSON.stringify(data.coords),
      }),
    };
    return super.updateById(id, processedData, trx);
  }
}
