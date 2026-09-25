import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface RitualSubstep {
  id: string;
  ritual_id: string;
  sort_order?: number | null;
  dua_arabic?: string | null;
  audio_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
  is_deleted?: boolean;
}

@Injectable()
export class RitualSubstepsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(TABLE_NAMES.RITUAL_SUBSTEPS) : this.db(TABLE_NAMES.RITUAL_SUBSTEPS);
  }

  findByRitualIds(ritualIds: string[], trx?: Knex.Transaction): Promise<RitualSubstep[]> {
    if (ritualIds.length === 0) return Promise.resolve([]);
    return this.qb(trx)
      .where({ is_deleted: false })
      .whereNull('deleted_at')
      .whereIn('ritual_id', ritualIds)
      .orderBy('sort_order') as unknown as Promise<RitualSubstep[]>;
  }

  /** Hard-delete all sub-steps of a ritual (their translations cascade). */
  deleteByRitual(ritualId: string, trx?: Knex.Transaction): Promise<number> {
    return this.qb(trx).where({ ritual_id: ritualId }).delete();
  }

  async insert(
    data: Partial<RitualSubstep> & { ritual_id: string },
    trx?: Knex.Transaction,
  ): Promise<RitualSubstep> {
    const [row] = await this.qb(trx)
      .insert({
        ritual_id: data.ritual_id,
        sort_order: data.sort_order ?? 0,
        dua_arabic: data.dua_arabic ?? null,
        audio_url: data.audio_url ?? null,
        updated_at: new Date(),
      })
      .returning('*');
    return row as RitualSubstep;
  }
}
