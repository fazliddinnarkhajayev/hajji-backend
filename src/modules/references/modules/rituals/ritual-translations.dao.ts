import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface RitualTranslation {
  id: string;
  ritual_id: string;
  lang: string;
  name?: string | null;
  description?: string | null;
  location?: string | null;
  duration?: string | null;
  instructions?: string | null;
  dua_transliteration?: string | null;
  dua_translation?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type RitualTranslationInput = Omit<
  RitualTranslation,
  'id' | 'ritual_id' | 'created_at' | 'updated_at'
>;

@Injectable()
export class RitualTranslationsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx
      ? trx(TABLE_NAMES.RITUAL_TRANSLATIONS)
      : this.db(TABLE_NAMES.RITUAL_TRANSLATIONS);
  }

  findByRitual(ritualId: string, trx?: Knex.Transaction): Promise<RitualTranslation[]> {
    return this.qb(trx).where({ ritual_id: ritualId }).orderBy('lang');
  }

  findByRitualIds(ritualIds: string[], trx?: Knex.Transaction): Promise<RitualTranslation[]> {
    if (ritualIds.length === 0) return Promise.resolve([]);
    return this.qb(trx).whereIn('ritual_id', ritualIds);
  }

  deleteByRitual(ritualId: string, trx?: Knex.Transaction): Promise<number> {
    return this.qb(trx).where({ ritual_id: ritualId }).delete();
  }

  /** Insert or update the translation for a given (ritual, lang). */
  async upsert(
    ritualId: string,
    lang: string,
    data: Partial<RitualTranslationInput>,
    trx?: Knex.Transaction,
  ): Promise<RitualTranslation> {
    const payload = {
      ritual_id: ritualId,
      lang,
      name: data.name ?? null,
      description: data.description ?? null,
      location: data.location ?? null,
      duration: data.duration ?? null,
      instructions: data.instructions ?? null,
      dua_transliteration: data.dua_transliteration ?? null,
      dua_translation: data.dua_translation ?? null,
      updated_at: new Date(),
    };
    const [row] = await this.qb(trx)
      .insert(payload)
      .onConflict(['ritual_id', 'lang'])
      .merge()
      .returning('*');
    return row as RitualTranslation;
  }
}
