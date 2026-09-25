import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LocationsService,
  LocationWithTranslations,
} from 'src/modules/references/modules/locations/locations.service';
import { CONTENT_LANGUAGES } from 'src/shared/constants';

export interface MobileLocationTranslation {
  lang: string;
  name: string | null;
  description: string | null;
}

export interface MobileLocationFull {
  id: string;
  category: string | null;
  order: number | null;
  name_ar: string;
  coords: [number, number] | null;
  emoji: string | null;
  translations: MobileLocationTranslation[];
}

export interface MobileLocationsPayload {
  count: number;
  version: string | null;
  langs: string[];
  items: MobileLocationFull[];
}

@Injectable()
export class MobileLocationsService {
  constructor(private readonly locationsService: LocationsService) {}

  private parseCoords(coords: unknown): [number, number] | null {
    if (Array.isArray(coords)) return coords as [number, number];
    if (typeof coords === 'string') {
      try {
        const arr = JSON.parse(coords);
        return Array.isArray(arr) ? (arr as [number, number]) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  private toFull(loc: LocationWithTranslations): MobileLocationFull {
    return {
      id: loc.id,
      category: loc.category ?? null,
      order: loc.sort_order ?? null,
      name_ar: loc.name_ar,
      coords: this.parseCoords(loc.coords),
      emoji: loc.emoji ?? null,
      translations: loc.translations.map((t) => ({
        lang: t.lang,
        name: t.name ?? null,
        description: t.description ?? null,
      })),
    };
  }

  private computeVersion(locs: LocationWithTranslations[]): string | null {
    let max = 0;
    for (const l of locs) {
      if (l.updated_at) max = Math.max(max, new Date(l.updated_at).getTime());
      for (const t of l.translations) {
        if (t.updated_at) max = Math.max(max, new Date(t.updated_at).getTime());
      }
    }
    return max > 0 ? new Date(max).toISOString() : null;
  }

  async findAll(): Promise<MobileLocationsPayload> {
    const locs = await this.locationsService.findAllWithTranslations();
    return {
      count: locs.length,
      version: this.computeVersion(locs),
      langs: [...CONTENT_LANGUAGES],
      items: locs.map((l) => this.toFull(l)),
    };
  }

  async findOne(id: string): Promise<MobileLocationFull> {
    const loc = await this.locationsService.findOneWithTranslations(id);
    if (!loc) throw new NotFoundException('Location not found');
    return this.toFull(loc);
  }
}
