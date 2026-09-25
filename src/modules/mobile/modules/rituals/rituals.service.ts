import { Injectable, NotFoundException } from '@nestjs/common';
import {
  RitualsService,
  RitualWithTranslations,
} from 'src/modules/references/modules/rituals/rituals.service';
import { CONTENT_LANGUAGES } from 'src/shared/constants';

/** One language's text for a ritual step. */
export interface MobileRitualTranslation {
  lang: string;
  name: string | null;
  description: string | null;
  location: string | null;
  duration: string | null;
  instructions: string | null;
  dua_transliteration: string | null;
  dua_translation: string | null;
}

/** One language's text for a ritual sub-step (e.g. a Tawaf circuit). */
export interface MobileSubstepTranslation {
  lang: string;
  title: string | null;
  instructions: string | null;
  dua_transliteration: string | null;
  dua_translation: string | null;
  note: string | null;
}

/** A ritual sub-step (circuit / trip) with ALL its translations. */
export interface MobileRitualSubstep {
  sort_order: number | null;
  dua_arabic: string | null;
  audio_url: string | null;
  translations: MobileSubstepTranslation[];
}

/** A ritual step with ALL its translations — the offline download shape. */
export interface MobileRitualFull {
  id: string;
  type: string;
  order: number | null;
  arabic: string | null;
  dua_arabic: string | null;
  audio_url: string | null;
  translations: MobileRitualTranslation[];
  substeps: MobileRitualSubstep[];
}

export interface MobileRitualsPayload {
  count: number;
  version: string | null;
  langs: string[];
  items: MobileRitualFull[];
}

@Injectable()
export class MobileRitualsService {
  constructor(private readonly ritualsService: RitualsService) {}

  private toFull(r: RitualWithTranslations): MobileRitualFull {
    return {
      id: r.id,
      type: r.type,
      order: r.sort_order ?? null,
      arabic: r.arabic ?? null,
      dua_arabic: r.dua_arabic ?? null,
      audio_url: r.audio_url ?? null,
      translations: r.translations.map((t) => ({
        lang: t.lang,
        name: t.name ?? null,
        description: t.description ?? null,
        location: t.location ?? null,
        duration: t.duration ?? null,
        instructions: t.instructions ?? null,
        dua_transliteration: t.dua_transliteration ?? null,
        dua_translation: t.dua_translation ?? null,
      })),
      substeps: (r.substeps ?? []).map((s) => ({
        sort_order: s.sort_order ?? null,
        dua_arabic: s.dua_arabic ?? null,
        audio_url: s.audio_url ?? null,
        translations: (s.translations ?? []).map((t) => ({
          lang: t.lang,
          title: t.title ?? null,
          instructions: t.instructions ?? null,
          dua_transliteration: t.dua_transliteration ?? null,
          dua_translation: t.dua_translation ?? null,
          note: t.note ?? null,
        })),
      })),
    };
  }

  /** Max updated_at across rituals + their translations — a cheap content version. */
  private computeVersion(rituals: RitualWithTranslations[]): string | null {
    let max = 0;
    for (const r of rituals) {
      if (r.updated_at) max = Math.max(max, new Date(r.updated_at).getTime());
      for (const t of r.translations) {
        if (t.updated_at) max = Math.max(max, new Date(t.updated_at).getTime());
      }
      for (const s of r.substeps ?? []) {
        if (s.updated_at) max = Math.max(max, new Date(s.updated_at).getTime());
        for (const st of s.translations ?? []) {
          if (st.updated_at) max = Math.max(max, new Date(st.updated_at).getTime());
        }
      }
    }
    return max > 0 ? new Date(max).toISOString() : null;
  }

  async findAll(type?: string): Promise<MobileRitualsPayload> {
    const rituals = await this.ritualsService.findAllWithTranslations(type);
    return {
      count: rituals.length,
      version: this.computeVersion(rituals),
      langs: [...CONTENT_LANGUAGES],
      items: rituals.map((r) => this.toFull(r)),
    };
  }

  async findOne(id: string): Promise<MobileRitualFull> {
    const ritual = await this.ritualsService.findOneWithTranslations(id);
    if (!ritual) throw new NotFoundException('Ritual not found');
    return this.toFull(ritual);
  }
}
