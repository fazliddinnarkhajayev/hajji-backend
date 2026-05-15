import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

export interface Dua {
  id: string;
  title: string;
  category: string;
  arabic: string;
  transliteration?: string;
  translation?: string;
  reference?: string;
  virtue?: string;
  audio_url?: string;
  created_at?: Date;
  created_by_id?: string;
  updated_at?: Date;
  updated_by_id?: string;
  is_deleted?: boolean;
}

@Injectable()
export class DuasDao extends BaseDao<Dua> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.DUAS, db);
  }
}
