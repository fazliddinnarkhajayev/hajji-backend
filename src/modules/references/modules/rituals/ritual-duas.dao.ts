import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface RitualDuaTranslation {
  dua_id: string;
  lang: string;
  title: string | null;
  transliteration: string | null;
  translation: string | null;
  reference: string | null;
  updated_at?: Date;
}

export interface RitualDua {
  id: string;
  ritual_id: string;
  substep_id: string | null;
  sort_order: number | null;
  dua_arabic: string;
  audio_url: string | null;
  updated_at?: Date;
  translations: RitualDuaTranslation[];
}

/**
 * Du'as of ritual steps / circuits (066_create_ritual_duas_tables). Read-only
 * here; filled by seed migrations. Until 066 has run the tables don't exist —
 * then every step simply has no du'as.
 */
@Injectable()
export class RitualDuasDao {
  private tablesReady: boolean | null = null;

  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private async ready(): Promise<boolean> {
    if (this.tablesReady) return true;
    const ok =
      (await this.db.schema.hasTable(TABLE_NAMES.RITUAL_DUAS)) &&
      (await this.db.schema.hasTable(TABLE_NAMES.RITUAL_DUA_TRANSLATIONS));
    // Remember only success: a later migration can still create the tables.
    if (ok) this.tablesReady = true;
    return ok;
  }

  async findWithTranslationsByRitualIds(ritualIds: string[]): Promise<RitualDua[]> {
    if (ritualIds.length === 0 || !(await this.ready())) return [];
    const duas = (await this.db(TABLE_NAMES.RITUAL_DUAS)
      .where({ is_deleted: false })
      .whereNull('deleted_at')
      .whereIn('ritual_id', ritualIds)
      .orderBy([{ column: 'substep_id', order: 'asc', nulls: 'first' }, { column: 'sort_order' }])) as Omit<RitualDua, 'translations'>[];
    if (duas.length === 0) return [];
    const trs = (await this.db(TABLE_NAMES.RITUAL_DUA_TRANSLATIONS).whereIn(
      'dua_id',
      duas.map((d) => d.id),
    )) as RitualDuaTranslation[];
    const byDua = new Map<string, RitualDuaTranslation[]>();
    for (const t of trs) {
      const arr = byDua.get(t.dua_id) ?? [];
      arr.push(t);
      byDua.set(t.dua_id, arr);
    }
    return duas.map((d) => ({ ...d, translations: byDua.get(d.id) ?? [] }));
  }
}
