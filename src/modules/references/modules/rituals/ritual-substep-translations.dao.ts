import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface RitualSubstepTranslation {
  id: string;
  substep_id: string;
  lang: string;
  title?: string | null;
  instructions?: string | null;
  dua_transliteration?: string | null;
  dua_translation?: string | null;
  note?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

@Injectable()
export class RitualSubstepTranslationsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx
      ? trx(TABLE_NAMES.RITUAL_SUBSTEP_TRANSLATIONS)
      : this.db(TABLE_NAMES.RITUAL_SUBSTEP_TRANSLATIONS);
  }

  findBySubstepIds(
    substepIds: string[],
    trx?: Knex.Transaction,
  ): Promise<RitualSubstepTranslation[]> {
    if (substepIds.length === 0) return Promise.resolve([]);
    return this.qb(trx).whereIn('substep_id', substepIds);
  }

  async insertMany(
    rows: Array<Omit<RitualSubstepTranslation, 'id' | 'created_at' | 'updated_at'>>,
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (rows.length === 0) return;
    await this.qb(trx).insert(rows.map((r) => ({ ...r, updated_at: new Date() })));
  }
}
