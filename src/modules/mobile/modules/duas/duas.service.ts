import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DuasService,
  DuaWithTranslations,
} from 'src/modules/references/modules/duas/duas.service';
import { CONTENT_LANGUAGES } from 'src/shared/constants';

/** One language's text for a dua. */
export interface MobileDuaTranslation {
  lang: string;
  name: string | null;
  situation: string | null;
  transliteration: string | null;
  translation: string | null;
  context: string | null;
}

/** A dua with ALL its translations — the offline download shape. */
export interface MobileDuaFull {
  id: string;
  category: string;
  order: number | null;
  text_ar: string;
  reference: string | null;
  audio_url: string | null;
  translations: MobileDuaTranslation[];
}

export interface MobileDuasPayload {
  count: number;
  version: string | null;
  langs: string[];
  items: MobileDuaFull[];
}

@Injectable()
export class MobileDuasService {
  constructor(private readonly duasService: DuasService) {}

  private toFull(dua: DuaWithTranslations): MobileDuaFull {
    return {
      id: dua.id,
      category: dua.category,
      order: dua.sort_order ?? null,
      text_ar: dua.arabic,
      reference: dua.reference ?? null,
      audio_url: dua.audio_url ?? null,
      translations: dua.translations.map((t) => ({
        lang: t.lang,
        name: t.title ?? null,
        situation: t.situation ?? null,
        transliteration: t.transliteration ?? null,
        translation: t.translation ?? null,
        context: t.context ?? null,
      })),
    };
  }

  /** Max updated_at across duas + their translations — a cheap content version. */
  private computeVersion(duas: DuaWithTranslations[]): string | null {
    let max = 0;
    for (const d of duas) {
      if (d.updated_at) max = Math.max(max, new Date(d.updated_at).getTime());
      for (const t of d.translations) {
        if (t.updated_at) max = Math.max(max, new Date(t.updated_at).getTime());
      }
    }
    return max > 0 ? new Date(max).toISOString() : null;
  }

  async findAll(): Promise<MobileDuasPayload> {
    const duas = await this.duasService.findAllWithTranslations();
    return {
      count: duas.length,
      version: this.computeVersion(duas),
      langs: [...CONTENT_LANGUAGES],
      items: duas.map((d) => this.toFull(d)),
    };
  }

  async findOne(id: string): Promise<MobileDuaFull> {
    const dua = await this.duasService.findOneWithTranslations(id);
    if (!dua) throw new NotFoundException('Dua not found');
    return this.toFull(dua);
  }
}
