import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Knex } from 'knex';
import { RitualsDao, Ritual } from './rituals.dao';
import { RitualTranslationsDao, RitualTranslation } from './ritual-translations.dao';
import { RitualSubstepsDao, RitualSubstep } from './ritual-substeps.dao';
import {
  RitualSubstepTranslationsDao,
  RitualSubstepTranslation,
} from './ritual-substep-translations.dao';
import { CreateRitualDto } from './dto/create-ritual.dto';
import { UpdateRitualDto } from './dto/update-ritual.dto';
import { BaseService } from 'src/shared/services/base.service';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';

export type SubstepWithTranslations = RitualSubstep & {
  translations: RitualSubstepTranslation[];
};
export type RitualWithTranslations = Ritual & {
  translations: RitualTranslation[];
  substeps?: SubstepWithTranslations[];
};

@Injectable()
export class RitualsService extends BaseService<Ritual, RitualsDao> {
  constructor(
    private readonly ritualsDao: RitualsDao,
    private readonly translationsDao: RitualTranslationsDao,
    private readonly substepsDao: RitualSubstepsDao,
    private readonly substepTranslationsDao: RitualSubstepTranslationsDao,
  ) {
    super(ritualsDao);
  }

  /** Load sub-steps (with translations) for the given ritual ids, grouped by ritual. */
  private async loadSubsteps(ritualIds: string[]): Promise<Map<string, SubstepWithTranslations[]>> {
    const byRitual = new Map<string, SubstepWithTranslations[]>();
    if (ritualIds.length === 0) return byRitual;

    const substeps = await this.substepsDao.findByRitualIds(ritualIds);
    if (substeps.length === 0) return byRitual;

    const trById = new Map<string, RitualSubstepTranslation[]>();
    const allTr = await this.substepTranslationsDao.findBySubstepIds(substeps.map((s) => s.id));
    for (const t of allTr) {
      const arr = trById.get(t.substep_id) ?? [];
      arr.push(t);
      trById.set(t.substep_id, arr);
    }

    for (const s of substeps) {
      const arr = byRitual.get(s.ritual_id) ?? [];
      arr.push({ ...s, translations: trById.get(s.id) ?? [] });
      byRitual.set(s.ritual_id, arr);
    }
    return byRitual;
  }

  // Strip nested `translations` / `substeps` before writing to `rituals`.
  private baseFields(dto: CreateRitualDto | UpdateRitualDto): Partial<Ritual> {
    const { translations: _t, substeps: _s, ...base } = dto as any;
    return base;
  }

  // Replace all sub-steps of a ritual (delete + re-insert with translations).
  private async replaceSubsteps(
    ritualId: string,
    substeps: CreateRitualDto['substeps'],
    trx: Knex.Transaction,
  ): Promise<void> {
    await this.substepsDao.deleteByRitual(ritualId, trx);
    for (const s of substeps ?? []) {
      const row = await this.substepsDao.insert(
        {
          ritual_id: ritualId,
          sort_order: s.sort_order ?? 0,
          dua_arabic: s.dua_arabic ?? null,
          audio_url: s.audio_url ?? null,
        },
        trx,
      );
      const trs = (s.translations ?? []).map((t) => ({
        substep_id: row.id,
        lang: t.lang,
        title: t.title ?? null,
        instructions: t.instructions ?? null,
        dua_transliteration: t.dua_transliteration ?? null,
        dua_translation: t.dua_translation ?? null,
        note: t.note ?? null,
      }));
      await this.substepTranslationsDao.insertMany(trs, trx);
    }
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
      if (dto.substeps !== undefined) {
        await this.replaceSubsteps(ritual.id, dto.substeps, trx);
      }
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
      if (dto.substeps !== undefined) {
        await this.replaceSubsteps(id, dto.substeps, trx);
      }

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
    const substepsByRitual = await this.loadSubsteps([id]);
    return { ...ritual, translations, substeps: substepsByRitual.get(id) ?? [] };
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
    const substepsByRitual = await this.loadSubsteps(ids);
    const withSubs = this.attach(page.items, all).map((r) => ({
      ...r,
      substeps: substepsByRitual.get(r.id) ?? [],
    }));
    return new PaginatedResult(withSubs, page.meta);
  }

  /** All ritual steps with every translation + sub-steps attached (non-paginated). */
  async findAllWithTranslations(type?: string): Promise<RitualWithTranslations[]> {
    const rituals = await this.ritualsDao.findAllOrdered(type);
    const ids = rituals.map((r) => r.id);
    const all = await this.translationsDao.findByRitualIds(ids);
    const substepsByRitual = await this.loadSubsteps(ids);
    return this.attach(rituals, all).map((r) => ({
      ...r,
      substeps: substepsByRitual.get(r.id) ?? [],
    }));
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
