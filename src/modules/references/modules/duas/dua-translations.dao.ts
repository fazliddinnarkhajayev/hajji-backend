import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface DuaTranslation {
  id: string;
  dua_id: string;
  lang: string;
  title?: string | null;
  situation?: string | null;
  transliteration?: string | null;
  translation?: string | null;
  context?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type DuaTranslationInput = Omit<
  DuaTranslation,
  'id' | 'dua_id' | 'created_at' | 'updated_at'
>;

@Injectable()
export class DuaTranslationsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(TABLE_NAMES.DUA_TRANSLATIONS) : this.db(TABLE_NAMES.DUA_TRANSLATIONS);
  }

  findByDua(duaId: string, trx?: Knex.Transaction): Promise<DuaTranslation[]> {
    return this.qb(trx).where({ dua_id: duaId }).orderBy('lang');
  }

  findByDuaIds(duaIds: string[], trx?: Knex.Transaction): Promise<DuaTranslation[]> {
    if (duaIds.length === 0) return Promise.resolve([]);
    return this.qb(trx).whereIn('dua_id', duaIds);
  }

  deleteByDua(duaId: string, trx?: Knex.Transaction): Promise<number> {
    return this.qb(trx).where({ dua_id: duaId }).delete();
  }

  /** Insert or update the translation for a given (dua, lang). */
  async upsert(
    duaId: string,
    lang: string,
    data: Partial<DuaTranslationInput>,
    trx?: Knex.Transaction,
  ): Promise<DuaTranslation> {
    const payload = {
      dua_id: duaId,
      lang,
      title: data.title ?? null,
      situation: data.situation ?? null,
      transliteration: data.transliteration ?? null,
      translation: data.translation ?? null,
      context: data.context ?? null,
      updated_at: new Date(),
    };
    const [row] = await this.qb(trx)
      .insert(payload)
      .onConflict(['dua_id', 'lang'])
      .merge()
      .returning('*');
    return row as DuaTranslation;
  }
}
