import type { Knex } from 'knex';

/**
 * Locations clean-up (2026-10-11), checked against OpenStreetMap:
 *   - soft-deletes the 5 old rows from the first seed (no category / order,
 *     English only) that duplicated the 057 rows or were misplaced;
 *   - fixes coordinates:
 *       Zamzam well: was 8 m WEST of the Kaaba centre (inside the Kaaba); the
 *         well is ~20 m EAST of the Kaaba, under the Mataf (no OSM node —
 *         placed 20 m east of the Kaaba outline's centre);
 *       Jannat al-Mu'alla: was ~400 m south, outside the cemetery; now the
 *         centre of OSM relation 6046910;
 *       Masjid al-Haram, Maqam Ibrahim: OSM outline centres (2–3 m moves);
 *   - adds As-Safa and Al-Marwah as two places (OSM nodes 4589923995 and the
 *     Marwah hill), replacing the old single "Safa & Marwah" pin that was
 *     ~50 m off the Mas'a;
 *   - fills descriptions in en / ru / uz_latin / uz_cyr.
 * Coordinates are [lat, lng], as in the rest of the table.
 */
type Lang = 'en' | 'ru' | 'uz_latin' | 'uz_cyr';
type Text = Record<Lang, { name: string; description: string }>;

/** Old first-seed rows: category and sort_order NULL. */
const LEGACY_NAMES_AR = ['جبل عرفات', 'بئر زمزم', 'مقام إبراهيم', 'الصفا والمروة', 'الكعبة'];

const UPDATES: Array<{ name_ar: string; coords: [number, number]; oldCoords: [number, number]; text: Text }> = [
  {
    name_ar: 'المسجد الحرام',
    coords: [21.42252, 39.82618],
    oldCoords: [21.4225, 39.8262],
    text: {
      en: { name: 'Masjid al-Haram', description: 'The Great Mosque of Makkah. The Kaaba stands at its centre, and Tawaf is performed here.' },
      ru: { name: 'Масджид аль-Харам', description: 'Великая мечеть Мекки. В её центре находится Кааба; здесь совершается таваф.' },
      uz_latin: { name: 'Masjid al-Haram', description: 'Makkadagi eng ulug‘ masjid. Uning markazida Ka‘ba joylashgan, Tavof shu yerda qilinadi.' },
      uz_cyr: { name: 'Масжид ал-Ҳарам', description: 'Маккадаги энг улуғ масжид. Унинг марказида Каъба жойлашган, Тавоф шу ерда қилинади.' },
    },
  },
  {
    name_ar: 'بئر زمزم',
    coords: [21.4225, 39.82637],
    oldCoords: [21.4225, 39.8261],
    text: {
      en: { name: 'Well of Zamzam', description: 'The blessed well east of the Kaaba, beneath the Mataf. Zamzam water is available from dispensers throughout the mosque.' },
      ru: { name: 'Колодец Замзам', description: 'Благословенный колодец к востоку от Каабы, под Матафом. Воду Замзам можно пить из раздатчиков по всей мечети.' },
      uz_latin: { name: 'Zamzam qudug‘i', description: 'Ka‘baning sharq tomonida, Matof ostidagi muborak quduq. Zamzam suvini masjid ichidagi suv idishlaridan ichish mumkin.' },
      uz_cyr: { name: 'Замзам қудуғи', description: 'Каъбанинг шарқ томонида, Матоф остидаги муборак қудуқ. Замзам сувини масжид ичидаги сув идишларидан ичиш мумкин.' },
    },
  },
  {
    name_ar: 'مقام إبراهيم',
    coords: [21.42258, 39.82631],
    oldCoords: [21.4226, 39.8263],
    text: {
      en: { name: 'Maqam Ibrahim', description: 'The stone Ibrahim (peace be upon him) stood on while building the Kaaba. The two rak‘ahs after Tawaf are prayed behind it.' },
      ru: { name: 'Макам Ибрахима', description: 'Камень, на котором стоял Ибрахим (мир ему), возводя Каабу. Два ракаата после тавафа совершают за ним.' },
      uz_latin: { name: 'Maqomi Ibrohim', description: 'Ibrohim alayhissalom Ka‘bani qurayotganda ustida turgan tosh. Tavofdan keyingi ikki rakat namoz uning ortida o‘qiladi.' },
      uz_cyr: { name: 'Мақоми Иброҳим', description: 'Иброҳим алайҳиссалом Каъбани қураётганда устида турган тош. Тавофдан кейинги икки ракат намоз унинг ортида ўқилади.' },
    },
  },
  {
    name_ar: 'جنة المعلاة',
    coords: [21.4345, 39.82813],
    oldCoords: [21.431, 39.829],
    text: {
      en: { name: "Jannat al-Mu'alla", description: 'The historic cemetery of Makkah, where Khadijah and many of the Prophet’s ﷺ family are buried.' },
      ru: { name: 'Джаннат аль-Муалла', description: 'Историческое кладбище Мекки, где похоронены Хадиджа и многие близкие Пророка ﷺ.' },
      uz_latin: { name: 'Jannat al-Mu‘alla', description: 'Makkaning tarixiy qabristoni. Unda Xadicha onamiz va Payg‘ambarimiz ﷺ ning ko‘plab yaqinlari dafn etilgan.' },
      uz_cyr: { name: 'Жаннат ал-Муъалло', description: 'Макканинг тарихий қабристони. Унда Хадича онамиз ва Пайғамбаримиз ﷺ нинг кўплаб яқинлари дафн этилган.' },
    },
  },
  {
    name_ar: 'جبل عرفات',
    coords: [21.3549, 39.9841],
    oldCoords: [21.3549, 39.9841],
    text: {
      en: { name: 'Mount Arafat', description: 'Jabal al-Rahmah in the plain of Arafat, where the central rite of Hajj — standing at Arafat — takes place.' },
      ru: { name: 'Гора Арафат', description: 'Холм Джабаль ар-Рахма в долине Арафат. Здесь совершается главный обряд хаджа — стояние на Арафате.' },
      uz_latin: { name: 'Arafot tog‘i', description: 'Arafot vodiysidagi Jabal ar-Rahma tepaligi. Hajning asosiy rukni — Arafotda turish — shu yerda ado etiladi.' },
      uz_cyr: { name: 'Арафот тоғи', description: 'Арафот водийсидаги Жабал ар-Раҳма тепалиги. Ҳажнинг асосий рукни — Арафотда туриш — шу ерда адо этилади.' },
    },
  },
];

const NEW_PLACES: Array<{ name_ar: string; coords: [number, number]; emoji: string; category: string; sort_order: number; text: Text }> = [
  {
    name_ar: 'الصفا',
    coords: [21.4218, 39.82743],
    emoji: '⛰️',
    category: 'historical',
    sort_order: 6,
    text: {
      en: { name: 'As-Safa', description: 'The hill where Sa‘i begins, at the southern end of the Mas‘a gallery.' },
      ru: { name: 'Сафа', description: 'Холм, с которого начинается сай; южный конец галереи Масъа.' },
      uz_latin: { name: 'Safo tepaligi', description: 'Sa‘y boshlanadigan tepalik, Mas‘o yo‘lagining janubiy uchida.' },
      uz_cyr: { name: 'Сафо тепалиги', description: 'Саъй бошланадиган тепалик, Масъо йўлагининг жанубий учида.' },
    },
  },
  {
    name_ar: 'المروة',
    coords: [21.42518, 39.82713],
    emoji: '⛰️',
    category: 'historical',
    sort_order: 7,
    text: {
      en: { name: 'Al-Marwah', description: 'The hill where Sa‘i ends, at the northern end of the Mas‘a gallery.' },
      ru: { name: 'Марва', description: 'Холм, на котором завершается сай; северный конец галереи Масъа.' },
      uz_latin: { name: 'Marva tepaligi', description: 'Sa‘y tugaydigan tepalik, Mas‘o yo‘lagining shimoliy uchida.' },
      uz_cyr: { name: 'Марва тепалиги', description: 'Саъй тугайдиган тепалик, Масъо йўлагининг шимолий учида.' },
    },
  },
];

const live = (q: Knex.QueryBuilder) => q.where({ is_deleted: false }).whereNull('deleted_at');

async function upsertTexts(trx: Knex.Transaction, locationId: string, text: Text) {
  for (const [lang, t] of Object.entries(text) as [Lang, { name: string; description: string }][]) {
    await trx('location_translations')
      .insert({ location_id: locationId, lang, name: t.name, description: t.description, updated_at: trx.fn.now() })
      .onConflict(['location_id', 'lang'])
      .merge(['name', 'description', 'updated_at']);
  }
}

exports.up = async function (knex: Knex) {
  await knex.transaction(async (trx) => {
    // 1. Old duplicates / misplaced rows from the first seed.
    await live(trx('locations'))
      .whereNull('category')
      .whereNull('sort_order')
      .whereIn('name_ar', LEGACY_NAMES_AR)
      .update({ is_deleted: true, deleted_at: trx.fn.now(), updated_at: trx.fn.now() });

    // 2. Coordinates and descriptions of the 057 places.
    for (const u of UPDATES) {
      const row = await live(trx('locations')).where({ name_ar: u.name_ar }).whereNotNull('category').first();
      if (!row) continue;
      await trx('locations').where({ id: row.id }).update({
        coords: JSON.stringify(u.coords),
        description: u.text.en.description,
        updated_at: trx.fn.now(),
      });
      await upsertTexts(trx, row.id, u.text);
    }

    // 3. Safa and Marwah as two places.
    for (const p of NEW_PLACES) {
      const exists = await live(trx('locations')).where({ name_ar: p.name_ar }).first();
      if (exists) continue;
      const [row] = await trx('locations')
        .insert({
          name: p.text.en.name,
          name_ar: p.name_ar,
          description: p.text.en.description,
          coords: JSON.stringify(p.coords),
          emoji: p.emoji,
          category: p.category,
          sort_order: p.sort_order,
        })
        .returning('id');
      await upsertTexts(trx, typeof row === 'object' ? row.id : row, p.text);
    }
  });
};

exports.down = async function (knex: Knex) {
  await knex.transaction(async (trx) => {
    await trx('locations').whereIn('name_ar', NEW_PLACES.map((p) => p.name_ar)).whereNotNull('category').delete();
    for (const u of UPDATES) {
      const row = await live(trx('locations')).where({ name_ar: u.name_ar }).whereNotNull('category').first();
      if (!row) continue;
      await trx('locations').where({ id: row.id }).update({ coords: JSON.stringify(u.oldCoords), description: null, updated_at: trx.fn.now() });
      await trx('location_translations').where({ location_id: row.id }).update({ description: null, updated_at: trx.fn.now() });
    }
    await trx('locations')
      .where({ is_deleted: true })
      .whereNull('category')
      .whereNull('sort_order')
      .whereIn('name_ar', LEGACY_NAMES_AR)
      .update({ is_deleted: false, deleted_at: null, updated_at: trx.fn.now() });
  });
};
