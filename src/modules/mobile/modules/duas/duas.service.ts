import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DuasService,
  DuaWithTranslations,
} from 'src/modules/references/modules/duas/duas.service';
import {
  CONTENT_LANGUAGES,
  DEFAULT_CONTENT_LANGUAGE,
  ContentLanguage,
} from 'src/shared/constants';

/** Flattened, single-language dua as consumed by the mobile app / offline DB. */
export interface MobileDua {
  id: string;
  category: string;
  order: number | null;
  text_ar: string;
  reference: string | null;
  audio_url: string | null;
  lang: string;
  name: string | null;
  situation: string | null;
  transliteration: string | null;
  translation: string | null;
  context: string | null;
}

export interface MobileDuasPayload {
  lang: string;
  count: number;
  version: string | null;
  items: MobileDua[];
}

@Injectable()
export class MobileDuasService {
  constructor(private readonly duasService: DuasService) {}

  private resolveLang(lang?: string): ContentLanguage {
    return (CONTENT_LANGUAGES as readonly string[]).includes(lang ?? '')
      ? (lang as ContentLanguage)
      : DEFAULT_CONTENT_LANGUAGE;
  }

  private flatten(dua: DuaWithTranslations, lang: ContentLanguage): MobileDua {
    const t =
      dua.translations.find((x) => x.lang === lang) ??
      dua.translations.find((x) => x.lang === DEFAULT_CONTENT_LANGUAGE) ??
      dua.translations[0];

    return {
      id: dua.id,
      category: dua.category,
      order: dua.sort_order ?? null,
      text_ar: dua.arabic,
      reference: dua.reference ?? null,
      audio_url: dua.audio_url ?? null,
      lang: t?.lang ?? lang,
      name: t?.title ?? null,
      situation: t?.situation ?? null,
      transliteration: t?.transliteration ?? null,
      translation: t?.translation ?? null,
      context: t?.context ?? null,
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

  async findAll(langInput?: string): Promise<MobileDuasPayload> {
    const lang = this.resolveLang(langInput);
    const duas = await this.duasService.findAllWithTranslations();
    return {
      lang,
      count: duas.length,
      version: this.computeVersion(duas),
      items: duas.map((d) => this.flatten(d, lang)),
    };
  }

  async findOne(id: string, langInput?: string): Promise<MobileDua> {
    const lang = this.resolveLang(langInput);
    const dua = await this.duasService.findOneWithTranslations(id);
    if (!dua) throw new NotFoundException('Dua not found');
    return this.flatten(dua, lang);
  }
}
