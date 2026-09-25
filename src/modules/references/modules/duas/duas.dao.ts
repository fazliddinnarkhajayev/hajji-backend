import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

export interface Dua {
  id: string;
  category: string;
  arabic: string;
  reference?: string;
  audio_url?: string;
  sort_order?: number | null;
  // Legacy single-language columns — kept for backward compat; new language
  // text lives in `dua_translations`.
  title?: string;
  transliteration?: string;
  translation?: string;
  virtue?: string;
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

  /** All duas in stable content order (for full offline download). */
  findAllOrdered(trx?: Knex.Transaction): Promise<Dua[]> {
    return this.qb(trx)
      .where({ is_deleted: false })
      .whereNull('deleted_at')
      .orderByRaw('sort_order asc nulls last')
      .orderBy('created_at', 'asc') as unknown as Promise<Dua[]>;
  }
}
