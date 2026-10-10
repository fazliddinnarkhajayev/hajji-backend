// Builds 067_seed_umrah_rituals_with_duas.ts from:
//   - the content files (extracted text, uz_cyr verbatim),
//   - 060_seed_rituals_umrah.ts (steps, verbatim),
//   - 063_seed_tawaf_substeps.ts (circuit titles/instructions/notes),
//   - translations.js (en / ru / titles).
// Usage: node generate.js <content_text.txt> <migrations dir>
const fs = require('fs');
const path = require('path');
const { T, Y_EN, Y_RU, Y_TITLE, REF, LEGACY, CIRCUIT_NOTE } = require('./translations');

const [contentPath, migDir] = process.argv.slice(2);
const lines = fs.readFileSync(contentPath, 'utf8').split(/\r?\n/);
const L = (n) => lines[n - 1]; // 1-based, as in the extracted file

// ── Existing seeds, read verbatim ──
function literal(file, startMarker, endMarker) {
  const src = fs.readFileSync(path.join(migDir, file), 'utf8');
  const a = src.indexOf(startMarker);
  const b = src.indexOf(endMarker, a);
  if (a < 0 || b < 0) throw new Error(`markers not found in ${file}`);
  const body = src.slice(src.indexOf("[", a + startMarker.length - 1), b + 2);
  return Function(`"use strict"; return (${body});`)();
}
const STEPS = literal('060_seed_rituals_umrah.ts', '}> = [', '\n];');
const CIRCUITS = literal('063_seed_tawaf_substeps.ts', 'const CIRCUITS: Circuit[] = [', '\n];');
if (STEPS.length !== 8 || CIRCUITS.length !== 7) throw new Error('unexpected seed shape');

// ── Text helpers ──
const cleanArabic = (s) => s.replace(/\[\d+\]/g, ' ').replace(/\s+/g, ' ').replace(/\s+\./g, '.').replace(/\.{2,}/g, '.').trim();

/** «translit» (Source). → { text, source } — the text itself unchanged. */
function splitTranslit(s) {
  let t = s.trim();
  let source = null;
  const m = t.match(/^(.*»)\s*\(([^)]+)\)\.?$/);
  if (m) { t = m[1]; source = m[2].trim(); }
  t = t.replace(/^«/, '').replace(/»\.?$/, '').trim();
  return { text: t, source };
}
function cleanMeaning(s) {
  return s.trim().replace(/^Маъноси:\s*/, '').replace(/^«/, '').replace(/»\.?$/, '').trim();
}

// Uzbek Cyrillic → Latin (official alphabet; o‘ g‘ with ‘ and ъ as ’, as in the existing seeds).
const VOWELS = 'аеёиоуўэюяАЕЁИОУЎЭЮЯ';
const MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ё: 'yo', ж: 'j', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '’', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o‘', қ: 'q', ғ: 'g‘', ҳ: 'h',
};
function toLatin(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const lower = ch.toLowerCase();
    const upper = ch !== lower;
    let r;
    if (lower === 'е') {
      const prev = s[i - 1];
      r = !prev || !/[\p{L}]/u.test(prev) || VOWELS.includes(prev) || prev === 'ъ' || prev === 'ь' ? 'ye' : 'e';
    } else if (lower in MAP) r = MAP[lower];
    else { out += ch; continue; }
    if (upper && r) {
      const next = s[i + 1];
      const nextUpper = next && next !== next.toLowerCase();
      r = nextUpper ? r.toUpperCase() : r[0].toUpperCase() + r.slice(1);
    }
    out += r;
  }
  return out;
}
// Uzbek Cyrillic transliteration → Russian letters.
const toRu = (s) => s.replace(/ҳ/g, 'х').replace(/Ҳ/g, 'Х').replace(/қ/g, 'к').replace(/Қ/g, 'К').replace(/ғ/g, 'г').replace(/Ғ/g, 'Г').replace(/ў/g, 'у').replace(/Ў/g, 'У');

const refFor = (source) => {
  if (!source) return { en: null, uz_latin: null, uz_cyr: null, ru: null };
  const r = REF[source];
  if (!r) throw new Error(`unknown source: ${source}`);
  return { en: r.en, uz_latin: toLatin(source), uz_cyr: source, ru: r.ru };
};

/** A content du'a: Arabic / transliteration / meaning lines from the extracted text. */
function contentDua(key, ar, tr, me, overrides = {}) {
  const t = overrides.t ?? T[key];
  const arabic = ar ? cleanArabic(L(ar)) : '';
  const { text: cyr, source } = tr ? splitTranslit(L(tr)) : overrides.translit;
  const cyrMeaning = me ? cleanMeaning(L(me)) : t.uzCyrMeaning;
  const ref = refFor(source);
  const tr4 = {
    en: { title: t.title.en, transliteration: (overrides.en ?? t.en).t, translation: (overrides.en ?? t.en).m, reference: ref.en },
    uz_latin: { title: t.title.uz_latin, transliteration: toLatin(cyr), translation: toLatin(cyrMeaning), reference: ref.uz_latin },
    uz_cyr: { title: t.title.uz_cyr, transliteration: cyr, translation: cyrMeaning, reference: ref.uz_cyr },
    ru: { title: t.title.ru, transliteration: toRu(cyr), translation: overrides.ru ?? t.ru, reference: ref.ru },
  };
  return { key, dua_arabic: arabic, translations: tr4 };
}

// ── Content du'as (line numbers in the extracted text) ──
const TAWAF_ENTRY = contentDua('T_ENTRY', 116, 117, 118);
// Short form: Arabic and transliteration are quoted inside line 119.
const shortLine = L(119);
const TAWAF_SHORT = (() => {
  const ar = shortLine.match(/«([^»]+)»/)[1];
  const cyr = shortLine.match(/–\s*([^–]+?)\s+дейишнинг/)[1].trim();
  return contentDua('T_SHORT', null, null, null, { translit: { text: cyr, source: null } , arOverride: ar });
})();
// contentDua reads Arabic from a line; the short form's Arabic is inline.
TAWAF_SHORT.dua_arabic = cleanArabic(shortLine.match(/«([^»]+)»/)[1]);

const CIRCUIT_LINES = [
  [121, 122, 123, 125, 126, 127],
  [130, 131, 132, 134, 135, 136],
  [139, 140, 141, 143, 144, 145],
  [148, 149, 150, 152, 153, 154],
  [157, 158, 159, 161, 162, 163],
  [166, 167, 168, 170, 171, 172],
  [175, 176, 177, 179, 180, 181],
];
const CIRCUIT_DUAS = CIRCUIT_LINES.map(([a, t, m, ya, yt, ym], i) => ({
  own: contentDua(`C${i + 1}`, a, t, m),
  yamani: contentDua('Y', ya, yt, ym, { t: { title: Y_TITLE }, en: Y_EN, ru: Y_RU }),
}));

const MAQAM = [contentDua('M1', 184, 185, 186), contentDua('M2', 190, 191, 192), contentDua('M3', 196, 197, 198), contentDua('M4', 201, 202, 203)];
const ZAMZAM = [contentDua('Z1', 206, 207, 208)];
const SAI = [contentDua('S1', 88, 89, 90), contentDua('S2', 93, 94, 95), contentDua('S3', 98, 99, 100), contentDua('S4', 104, 105, 106), contentDua('S5', 109, 110, 111)];
const HALQ = [contentDua('H1', 81, 82, 83)];

// Sanity: the lines really are what we think they are.
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
expect(/[\u0600-\u06FF]/.test(TAWAF_ENTRY.dua_arabic), 'tawaf entry arabic');
for (const d of [TAWAF_ENTRY, ...CIRCUIT_DUAS.flatMap((c) => [c.own, c.yamani]), ...MAQAM, ...ZAMZAM, ...SAI, ...HALQ, TAWAF_SHORT]) {
  expect(/[\u0600-\u06FF]/.test(d.dua_arabic) && !/[А-Яа-я]/.test(d.dua_arabic), `${d.key}: arabic line`);
  expect(/[А-Яа-яЎўҲҳҚқҒғ]/.test(d.translations.uz_cyr.transliteration), `${d.key}: cyrillic transliteration`);
  expect(!/^Маъноси/.test(d.translations.uz_cyr.translation) && d.translations.uz_cyr.translation.length > 20, `${d.key}: meaning`);
  expect(!/\[\d+\]/.test(d.dua_arabic), `${d.key}: footnote left`);
}

// Legacy (DB-only) du'as from the step fields of 060.
function legacyDua(sortOrder) {
  const step = STEPS[sortOrder];
  const extra = LEGACY[sortOrder];
  const tr = {};
  for (const lang of ['en', 'uz_latin', 'uz_cyr', 'ru']) {
    const s = step.translations[lang];
    tr[lang] = {
      title: extra.title[lang],
      transliteration: lang === 'en' && extra.en ? extra.en.t : s.dua_transliteration,
      translation: lang === 'en' && extra.en ? extra.en.m : s.dua_translation,
      reference: null,
    };
  }
  return { key: `LEGACY_${sortOrder}`, dua_arabic: step.dua_arabic, translations: tr };
}

// ── Assemble: du'as per step (sort_order) and per Tawaf circuit ──
const STEP_DUAS = {
  0: [legacyDua(0)],
  1: [legacyDua(1)],
  2: [TAWAF_ENTRY, TAWAF_SHORT],
  3: MAQAM,
  4: ZAMZAM,
  5: SAI,
  6: [...HALQ, legacyDua(6)],
  7: [legacyDua(7)],
};

const strip = (d) => ({ dua_arabic: d.dua_arabic, translations: d.translations });
const DATA = {
  steps: STEPS,
  stepDuas: Object.fromEntries(Object.entries(STEP_DUAS).map(([k, v]) => [k, v.map(strip)])),
  circuits: CIRCUITS.map((c, i) => {
    const own = CIRCUIT_DUAS[i].own;
    const translations = {};
    for (const lang of ['en', 'uz_latin', 'uz_cyr', 'ru']) {
      const old = c.translations[lang];
      // Circuit 1's old note pointed at the old "Rabbana atina" du'a; it is replaced.
      const keepOld = c.sort_order !== 1 && old.note;
      translations[lang] = {
        title: old.title,
        instructions: old.instructions,
        note: keepOld ? `${CIRCUIT_NOTE[lang]} ${old.note}` : CIRCUIT_NOTE[lang],
        dua_transliteration: own.translations[lang].transliteration,
        dua_translation: own.translations[lang].translation,
      };
    }
    return { sort_order: c.sort_order, dua_arabic: own.dua_arabic, translations, duas: [strip(own), strip(CIRCUIT_DUAS[i].yamani)] };
  }),
};

// ── Write the migration ──
const json = (v) => JSON.stringify(v, null, 2);
const seed = `import type { Knex } from 'knex';

/**
 * Umrah rituals — full reseed with the du'as from the content files
 * (D:\\hajji\\content: Тавоф, Саъй, Арафот (soch oldirish), …).
 *
 * REPLACES all Umrah ritual data: deletes the Umrah steps (translations,
 * substeps and du'as go with them by FK cascade), then inserts:
 *   - the 8 steps exactly as 060_seed_rituals_umrah (step du'a fields unchanged),
 *   - the 7 Tawaf circuits as 063 (titles, instructions) but each with its own
 *     du'a from the content and a note about the Yemeni-Corner du'a,
 *   - ritual_duas: every du'a of each step / circuit, in order — content du'as
 *     plus the du'as that were only in the database (Ihram, Talbiyah, Halq,
 *     Completion).
 *
 * Languages: uz_cyr = the content text unchanged (outer «» and the source in
 * parentheses moved to \`reference\`; footnote marks like [3] removed from the
 * Arabic); uz_latin = letter-by-letter Latin of the uz_cyr text; en / ru =
 * translations of it; ru transliteration = the uz_cyr one in Russian letters.
 *
 * Generated — see docs/rituals-duas-seed.md.
 */

type Tr = { title: string | null; transliteration: string | null; translation: string | null; reference: string | null };
type Dua = { dua_arabic: string; translations: Record<string, Tr> };

const STEPS: Array<{ sort_order: number; arabic: string | null; dua_arabic: string | null; translations: Record<string, Record<string, string | null>> }> = ${json(DATA.steps)};

/** Du'as per step (key = step sort_order), not tied to a circuit. */
const STEP_DUAS: Record<string, Dua[]> = ${json(DATA.stepDuas)};

/** Tawaf circuits (step sort_order 2). */
const CIRCUITS: Array<{ sort_order: number; dua_arabic: string; translations: Record<string, Record<string, string | null>>; duas: Dua[] }> = ${json(DATA.circuits)};

const TAWAF_SORT_ORDER = 2;

async function insertDuas(trx: Knex.Transaction, ritualId: string, substepId: string | null, duas: Dua[]) {
  for (const [i, d] of duas.entries()) {
    const [row] = await trx('ritual_duas')
      .insert({ ritual_id: ritualId, substep_id: substepId, sort_order: i + 1, dua_arabic: d.dua_arabic })
      .returning('id');
    const duaId = (row as any).id ?? row;
    await trx('ritual_dua_translations').insert(
      Object.entries(d.translations).map(([lang, t]) => ({ dua_id: duaId, lang, ...t })),
    );
  }
}

exports.up = async function (knex: Knex) {
  await knex.transaction(async (trx) => {
    // Full replace (translations, substeps and du'as cascade).
    await trx('rituals').where({ type: 'umrah' }).del();

    for (const step of STEPS) {
      const [ritual] = await trx('rituals')
        .insert({ type: 'umrah', sort_order: step.sort_order, arabic: step.arabic, dua_arabic: step.dua_arabic })
        .returning('id');
      const ritualId = (ritual as any).id ?? ritual;

      await trx('ritual_translations').insert(
        Object.entries(step.translations).map(([lang, t]) => ({ ritual_id: ritualId, lang, ...t })),
      );
      await insertDuas(trx, ritualId, null, STEP_DUAS[String(step.sort_order)] ?? []);

      if (step.sort_order !== TAWAF_SORT_ORDER) continue;
      for (const c of CIRCUITS) {
        const [sub] = await trx('ritual_substeps')
          .insert({ ritual_id: ritualId, sort_order: c.sort_order, dua_arabic: c.dua_arabic })
          .returning('id');
        const substepId = (sub as any).id ?? sub;
        await trx('ritual_substep_translations').insert(
          Object.entries(c.translations).map(([lang, t]) => ({ substep_id: substepId, lang, ...t })),
        );
        await insertDuas(trx, ritualId, substepId, c.duas);
      }
    }
  });
};

exports.down = async function (knex: Knex) {
  // Data-only migration: removes the Umrah rituals it inserted (everything cascades).
  await knex('rituals').where({ type: 'umrah' }).del();
};
`;
fs.writeFileSync(path.join(migDir, '067_seed_umrah_rituals_with_duas.ts'), seed);

const count = Object.values(DATA.stepDuas).flat().length + DATA.circuits.reduce((n, c) => n + c.duas.length, 0);
console.log('steps', DATA.steps.length, 'circuits', DATA.circuits.length, 'ritual_duas', count);
