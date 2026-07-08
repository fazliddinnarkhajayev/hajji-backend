import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface LocationTranslation {
  id: string;
  location_id: string;
  lang: string;
  name?: string | null;
  description?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export type LocationTranslationInput = Omit<
  LocationTranslation,
  'id' | 'location_id' | 'created_at' | 'updated_at'
>;

@Injectable()
export class LocationTranslationsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(TABLE_NAMES.LOCATION_TRANSLATIONS) : this.db(TABLE_NAMES.LOCATION_TRANSLATIONS);
  }

  findByLocation(locationId: string, trx?: Knex.Transaction): Promise<LocationTranslation[]> {
    return this.qb(trx).where({ location_id: locationId }).orderBy('lang');
  }

  findByLocationIds(ids: string[], trx?: Knex.Transaction): Promise<LocationTranslation[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.qb(trx).whereIn('location_id', ids);
  }

  deleteByLocation(locationId: string, trx?: Knex.Transaction): Promise<number> {
    return this.qb(trx).where({ location_id: locationId }).delete();
  }

  async upsert(
    locationId: string,
    lang: string,
    data: Partial<LocationTranslationInput>,
    trx?: Knex.Transaction,
  ): Promise<LocationTranslation> {
    const payload = {
      location_id: locationId,
      lang,
      name: data.name ?? null,
      description: data.description ?? null,
      updated_at: new Date(),
    };
    const [row] = await this.qb(trx)
      .insert(payload)
      .onConflict(['location_id', 'lang'])
      .merge()
      .returning('*');
    return row as LocationTranslation;
  }
}
