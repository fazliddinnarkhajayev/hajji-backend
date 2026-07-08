import type { Knex } from 'knex';

/**
 * Seeds the locations that were hard-coded mock data in the hajji-guide app,
 * with translations (en / ru / uz_latin / uz_cyr). Additive — existing
 * locations (admin-created / used by hajji-mobile) are left untouched.
 */

type Lang = 'en' | 'ru' | 'uz_latin' | 'uz_cyr';

type Seed = {
  name_ar: string;
  category: string;
  coords: [number, number];
  emoji: string;
  sort_order: number;
  names: Record<Lang, string>;
};

const SEEDS: Seed[] = [
  {
    name_ar: 'المسجد الحرام',
    category: 'mosques',
    coords: [21.4225, 39.8262],
    emoji: '🕋',


    sort_order: 1,
    names: {
      en: 'Masjid al-Haram',
      ru: 'Масджид аль-Харам',
      uz_latin: 'Masjid al-Haram',
      uz_cyr: 'Масжид ал-Ҳарам',
    },
  },
  {
    name_ar: 'بئر زمزم',
    category: 'zamzam',
    coords: [21.4225, 39.8261],
    emoji: '💧',


    sort_order: 2,
    names: {
      en: 'Well of Zamzam',
      ru: 'Колодец Замзам',
      uz_latin: 'Zamzam qudug‘i',
      uz_cyr: 'Замзам қудуғи',
    },
  },
  {
    name_ar: 'مقام إبراهيم',
    category: 'historical',
    coords: [21.4226, 39.8263],
    emoji: '👣',


    sort_order: 3,
    names: {
      en: 'Maqam Ibrahim',
      ru: 'Макам Ибрахима',
      uz_latin: 'Maqomi Ibrohim',
      uz_cyr: 'Мақоми Иброҳим',
    },
  },
  {
    name_ar: 'جنة المعلاة',
    category: 'cemeteries',
    coords: [21.431, 39.829],
    emoji: '🪦',


    sort_order: 4,
    names: {
      en: "Jannat al-Mu'alla",
      ru: 'Джаннат аль-Муалла',
      uz_latin: 'Jannat al-Mu‘alla',
      uz_cyr: 'Жаннат ал-Муъалло',
    },
  },
  {
    name_ar: 'جبل عرفات',
    category: 'historical',
    coords: [21.3549, 39.9841],
    emoji: '⛰️',


    sort_order: 5,
    names: {
      en: 'Mount Arafat',
      ru: 'Гора Арафат',
      uz_latin: 'Arafot tog‘i',
      uz_cyr: 'Арафот тоғи',
    },
  },
];

exports.up = async function (knex: Knex) {
  // Idempotency guard.
  const already = await knex('location_translations')
    .where({ lang: 'ru', name: 'Масджид аль-Харам' })
    .first();
  if (already) return;

  for (const s of SEEDS) {
    const [row] = await knex('locations')
      .insert({
        name: s.names.en, // base/default name (read by other apps)
        name_ar: s.name_ar,
        coords: JSON.stringify(s.coords),
        emoji: s.emoji,
        category: s.category,
        sort_order: s.sort_order,
      })
      .returning('id');
    const locationId = typeof row === 'object' ? row.id : row;

    const rows = (Object.entries(s.names) as [Lang, string][]).map(([lang, name]) => ({
      location_id: locationId,
      lang,
      name,
      description: null,
    }));
    await knex('location_translations').insert(rows);
  }
};

exports.down = async function (knex: Knex) {
  const names = SEEDS.map((s) => s.name_ar);
  await knex('locations').whereIn('name_ar', names).delete();
};
