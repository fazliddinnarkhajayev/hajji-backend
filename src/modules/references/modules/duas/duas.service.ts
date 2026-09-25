import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Knex } from 'knex';
import { DuasDao, Dua } from './duas.dao';
import { DuaTranslationsDao, DuaTranslation } from './dua-translations.dao';
import { CreateDuaDto } from './dto/create-dua.dto';
import { UpdateDuaDto } from './dto/update-dua.dto';
import { BaseService } from 'src/shared/services/base.service';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';

export type DuaWithTranslations = Dua & { translations: DuaTranslation[] };

@Injectable()
export class DuasService extends BaseService<Dua, DuasDao> {
  constructor(
    private readonly duasDao: DuasDao,
    private readonly translationsDao: DuaTranslationsDao,
  ) {
    super(duasDao);
  }

  // Strip `translations` before writing to the `duas` table.
  private baseFields(dto: CreateDuaDto | UpdateDuaDto): Partial<Dua> {
    const { translations: _t, ...base } = dto as any;
    return base;
  }

  private async upsertTranslations(
    duaId: string,
    translations: CreateDuaDto['translations'],
    trx: Knex.Transaction,
  ): Promise<void> {
    for (const t of translations ?? []) {
      const { lang, ...rest } = t;
      await this.translationsDao.upsert(duaId, lang, rest, trx);
    }
  }

  // ── Create ──────────────────────────────────────────────────
  async createWithTranslations(dto: CreateDuaDto): Promise<DuaWithTranslations> {
    return this.duasDao.transaction(async (trx) => {
      const dua = await this.duasDao.insert(this.baseFields(dto), trx);
      await this.upsertTranslations(dua.id, dto.translations, trx);
      const translations = await this.translationsDao.findByDua(dua.id, trx);
      return { ...dua, translations };
    });
  }

  // ── Update ──────────────────────────────────────────────────
  async updateWithTranslations(
    id: string,
    dto: UpdateDuaDto,
  ): Promise<DuaWithTranslations> {
    return this.duasDao.transaction(async (trx) => {
      const existing = await this.duasDao.findById(id, trx);
      if (!existing) throw new NotFoundException('Dua not found');

      const base = this.baseFields(dto);
      if (Object.keys(base).length > 0) {
        await this.duasDao.updateById(id, base, trx);
      }
      await this.upsertTranslations(id, dto.translations, trx);

      const dua = await this.duasDao.findById(id, trx);
      const translations = await this.translationsDao.findByDua(id, trx);
      return { ...(dua as Dua), translations };
    });
  }

  // ── Read (admin: all languages attached) ────────────────────
  async findOneWithTranslations(id: string): Promise<DuaWithTranslations> {
    const dua = await this.duasDao.findById(id);
    if (!dua) throw new NotFoundException('Dua not found');
    const translations = await this.translationsDao.findByDua(id);
    return { ...dua, translations };
  }

  async findAllPaginatedWithTranslations(
    pageIndex: number,
    pageSize: number,
  ): Promise<PaginatedResult<DuaWithTranslations>> {
    const page = await this.duasDao.findManyPaginated({}, pageIndex, pageSize);
    const ids = page.items.map((d) => d.id);
    const all = await this.translationsDao.findByDuaIds(ids);
    const byDua = new Map<string, DuaTranslation[]>();
    for (const t of all) {
      const arr = byDua.get(t.dua_id) ?? [];
      arr.push(t);
      byDua.set(t.dua_id, arr);
    }
    const items = page.items.map((d) => ({
      ...d,
      translations: byDua.get(d.id) ?? [],
    }));
    return new PaginatedResult(items, page.meta);
  }

  /** All duas with every translation attached (non-paginated). */
  async findAllWithTranslations(): Promise<DuaWithTranslations[]> {
    const duas = await this.duasDao.findAllOrdered();
    const ids = duas.map((d) => d.id);
    const all = await this.translationsDao.findByDuaIds(ids);
    const byDua = new Map<string, DuaTranslation[]>();
    for (const t of all) {
      const arr = byDua.get(t.dua_id) ?? [];
      arr.push(t);
      byDua.set(t.dua_id, arr);
    }
    return duas.map((d) => ({ ...d, translations: byDua.get(d.id) ?? [] }));
  }

  deleteAudioFile(audioUrl: string): void {
    if (!audioUrl?.startsWith('/uploads/')) return;
    const filePath = join(process.cwd(), audioUrl);
    if (existsSync(filePath)) {
      try {
        unlinkSync(filePath);
      } catch {
        /* ignore */
      }
    }
  }
}
