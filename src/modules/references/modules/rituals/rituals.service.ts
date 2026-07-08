import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Knex } from 'knex';
import { RitualsDao, Ritual } from './rituals.dao';
import { RitualTranslationsDao, RitualTranslation } from './ritual-translations.dao';
import { CreateRitualDto } from './dto/create-ritual.dto';
import { UpdateRitualDto } from './dto/update-ritual.dto';
import { BaseService } from 'src/shared/services/base.service';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';

export type RitualWithTranslations = Ritual & { translations: RitualTranslation[] };

@Injectable()
export class RitualsService extends BaseService<Ritual, RitualsDao> {
  constructor(
    private readonly ritualsDao: RitualsDao,
    private readonly translationsDao: RitualTranslationsDao,
  ) {
    super(ritualsDao);
  }

  // Strip `translations` before writing to the `rituals` table.
  private baseFields(dto: CreateRitualDto | UpdateRitualDto): Partial<Ritual> {
    const { translations: _t, ...base } = dto as any;
    return base;
  }

  private async upsertTranslations(
    ritualId: string,
    translations: CreateRitualDto['translations'],
    trx: Knex.Transaction,
  ): Promise<void> {
    for (const t of translations ?? []) {
      const { lang, ...rest } = t;
      await this.translationsDao.upsert(ritualId, lang, rest, trx);
    }
  }

  private attach(
    rituals: Ritual[],
    translations: RitualTranslation[],
  ): RitualWithTranslations[] {
    const byRitual = new Map<string, RitualTranslation[]>();
    for (const t of translations) {
      const arr = byRitual.get(t.ritual_id) ?? [];
      arr.push(t);
      byRitual.set(t.ritual_id, arr);
    }
    return rituals.map((r) => ({ ...r, translations: byRitual.get(r.id) ?? [] }));
  }

  // ── Create ──────────────────────────────────────────────────
  async createWithTranslations(dto: CreateRitualDto): Promise<RitualWithTranslations> {
    return this.ritualsDao.transaction(async (trx) => {
      const ritual = await this.ritualsDao.insert(this.baseFields(dto), trx);
      await this.upsertTranslations(ritual.id, dto.translations, trx);
      const translations = await this.translationsDao.findByRitual(ritual.id, trx);
      return { ...ritual, translations };
    });
  }

  // ── Update ──────────────────────────────────────────────────
  async updateWithTranslations(
    id: string,
    dto: UpdateRitualDto,
  ): Promise<RitualWithTranslations> {
    return this.ritualsDao.transaction(async (trx) => {
      const existing = await this.ritualsDao.findById(id, trx);
      if (!existing) throw new NotFoundException('Ritual not found');

      const base = this.baseFields(dto);
      if (Object.keys(base).length > 0) {
        await this.ritualsDao.updateById(id, base, trx);
      }
      await this.upsertTranslations(id, dto.translations, trx);

      const ritual = await this.ritualsDao.findById(id, trx);
      const translations = await this.translationsDao.findByRitual(id, trx);
      return { ...(ritual as Ritual), translations };
    });
  }

  // ── Read (admin: all languages attached) ────────────────────
  async findOneWithTranslations(id: string): Promise<RitualWithTranslations> {
    const ritual = await this.ritualsDao.findById(id);
    if (!ritual) throw new NotFoundException('Ritual not found');
    const translations = await this.translationsDao.findByRitual(id);
    return { ...ritual, translations };
  }

  async findAllPaginatedWithTranslations(
    pageIndex: number,
    pageSize: number,
    type?: string,
  ): Promise<PaginatedResult<RitualWithTranslations>> {
    const where = type ? ({ type } as Partial<Ritual>) : {};
    const page = await this.ritualsDao.findManyPaginated(where, pageIndex, pageSize);
    const ids = page.items.map((r) => r.id);
    const all = await this.translationsDao.findByRitualIds(ids);
    return new PaginatedResult(this.attach(page.items, all), page.meta);
  }

  /** All ritual steps with every translation attached (non-paginated). */
  async findAllWithTranslations(type?: string): Promise<RitualWithTranslations[]> {
    const rituals = await this.ritualsDao.findAllOrdered(type);
    const ids = rituals.map((r) => r.id);
    const all = await this.translationsDao.findByRitualIds(ids);
    return this.attach(rituals, all);
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
