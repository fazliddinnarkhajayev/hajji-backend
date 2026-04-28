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

  async insert(data: Partial<Location>) {
    // Ensure coords is stored as JSON string
    const processedData = {
      ...data,
      coords: typeof data.coords === 'string' ? data.coords : JSON.stringify(data.coords),
    };
    return super.insert(processedData);
  }

  async updateById(id: string, data: Partial<Location>) {
    const processedData = {
      ...data,
      ...(data.coords && {
        coords: typeof data.coords === 'string' ? data.coords : JSON.stringify(data.coords),
      }),
    };
    return super.updateById(id, processedData);
  }
}
