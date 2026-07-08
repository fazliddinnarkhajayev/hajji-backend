import { Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { LocationsDao, Location } from './locations.dao';
import {
  LocationTranslationsDao,
  LocationTranslation,
} from './location-translations.dao';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { BaseService } from 'src/shared/services/base.service';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';

export type LocationWithTranslations = Location & {
  translations: LocationTranslation[];
};

@Injectable()
export class LocationsService extends BaseService<Location, LocationsDao> {
  constructor(
    private readonly locationsDao: LocationsDao,
    private readonly translationsDao: LocationTranslationsDao,
  ) {
    super(locationsDao);
  }

  // Strip `translations` before writing to the `locations` table.
  private baseFields(dto: CreateLocationDto | UpdateLocationDto): Partial<Location> {
    const { translations: _t, ...base } = dto as any;
    return base;
  }

  // Base `name` is NOT NULL and read by other apps — derive it when the admin
  // only supplies per-language names.
  private deriveName(dto: CreateLocationDto): string {
    if (dto.name) return dto.name;
    const t = dto.translations ?? [];
    return (
      t.find((x) => x.lang === 'en' && x.name)?.name ??
      t.find((x) => x.lang === 'ru' && x.name)?.name ??
      t.find((x) => x.name)?.name ??
      dto.name_ar
    );
  }

  private async upsertTranslations(
    locationId: string,
    translations: CreateLocationDto['translations'],
    trx: Knex.Transaction,
  ): Promise<void> {
    for (const t of translations ?? []) {
      const { lang, ...rest } = t;
      await this.translationsDao.upsert(locationId, lang, rest, trx);
    }
  }

  async createWithTranslations(dto: CreateLocationDto): Promise<LocationWithTranslations> {
    return this.locationsDao.transaction(async (trx) => {
      const base = { ...this.baseFields(dto), name: this.deriveName(dto) };
      const location = await this.locationsDao.insert(base, trx);
      await this.upsertTranslations(location.id, dto.translations, trx);
      const translations = await this.translationsDao.findByLocation(location.id, trx);
      return { ...location, translations };
    });
  }

  async updateWithTranslations(
    id: string,
    dto: UpdateLocationDto,
  ): Promise<LocationWithTranslations> {
    return this.locationsDao.transaction(async (trx) => {
      const existing = await this.locationsDao.findById(id, trx);
      if (!existing) throw new NotFoundException('Location not found');

      const base = this.baseFields(dto);
      if (Object.keys(base).length > 0) {
        await this.locationsDao.updateById(id, base, trx);
      }
      await this.upsertTranslations(id, dto.translations, trx);

      const location = await this.locationsDao.findById(id, trx);
      const translations = await this.translationsDao.findByLocation(id, trx);
      return { ...(location as Location), translations };
    });
  }

  async findOneWithTranslations(id: string): Promise<LocationWithTranslations> {
    const location = await this.locationsDao.findById(id);
    if (!location) throw new NotFoundException('Location not found');
    const translations = await this.translationsDao.findByLocation(id);
    return { ...location, translations };
  }

  private attach(
    items: Location[],
    all: LocationTranslation[],
  ): LocationWithTranslations[] {
    const byLoc = new Map<string, LocationTranslation[]>();
    for (const t of all) {
      const arr = byLoc.get(t.location_id) ?? [];
      arr.push(t);
      byLoc.set(t.location_id, arr);
    }
    return items.map((l) => ({ ...l, translations: byLoc.get(l.id) ?? [] }));
  }

  async findAllPaginatedWithTranslations(
    pageIndex: number,
    pageSize: number,
  ): Promise<PaginatedResult<LocationWithTranslations>> {
    const page = await this.locationsDao.findManyPaginated({}, pageIndex, pageSize);
    const all = await this.translationsDao.findByLocationIds(page.items.map((l) => l.id));
    return new PaginatedResult(this.attach(page.items, all), page.meta);
  }

  async findAllWithTranslations(): Promise<LocationWithTranslations[]> {
    const locations = await this.locationsDao.findAllOrdered();
    const all = await this.translationsDao.findByLocationIds(locations.map((l) => l.id));
    return this.attach(locations, all);
  }
}
