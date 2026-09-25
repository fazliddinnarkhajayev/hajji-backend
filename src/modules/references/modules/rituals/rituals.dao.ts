import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { BaseDao } from 'src/shared/dao/base.dao';

export interface Ritual {
  id: string;
  type: string; // umrah | hajj
  sort_order?: number | null;
  arabic?: string | null;
  dua_arabic?: string | null;
  audio_url?: string | null;
  created_at?: Date;
  created_by_id?: string;
  updated_at?: Date;
  updated_by_id?: string;
  is_deleted?: boolean;
}

@Injectable()
export class RitualsDao extends BaseDao<Ritual> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.RITUALS, db);
  }

  /** Ritual steps in stable content order (optionally filtered by type). */
  findAllOrdered(type?: string, trx?: Knex.Transaction): Promise<Ritual[]> {
    let q = this.qb(trx).where({ is_deleted: false }).whereNull('deleted_at');
    if (type) q = q.where({ type });
    return q
      .orderBy('type')
      .orderByRaw('sort_order asc nulls last')
      .orderBy('created_at', 'asc') as unknown as Promise<Ritual[]>;
  }
}
