import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

export interface Region {
  id: string;
  name: string;
  country_id?: string;
  soato?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable()
export class RegionsDao extends BaseDao<Region> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.REGIONS, db);
  }
}
