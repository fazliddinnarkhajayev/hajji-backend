import type { Knex } from 'knex';

/**
 * Seeds the 7 circuits (ashwāṭ) of Tawaf as ritual sub-steps, in 4 languages.
 * The recommended du'a between the Yemeni Corner and the Black Stone
 * (Rabbanā ātinā...) is the same each round; the *instructions* differ
 * (raml/brisk pace in rounds 1–3, normal pace in 4–7, istilām each round).
 */

const DUA_AR = 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّار';
const DUA_TRANSLIT = 'Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ʿadhāban-nār';
const DUA_TR = {
  en: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.',
  uz_latin: 'Robbimiz, bizga dunyoda ham, oxiratda ham yaxshilik ber va bizni do‘zax azobidan saqla.',
  uz_cyr: 'Роббимиз, бизга дунёда ҳам, охиратда ҳам яхшилик бер ва бизни дўзах азобидан сақла.',
  ru: 'Господь наш, даруй нам благо в этом мире и в Последней жизни и защити нас от мучений Огня.',
};

type Tr = { title: string; instructions: string; note: string | null };
type Circuit = { sort_order: number; translations: Record<string, Tr> };

const CIRCUITS: Circuit[] = [
  {
    sort_order: 1,
    translations: {
      en: { title: 'Circuit 1', instructions: 'Start at the Black Stone. Face it, raise your hands and say “Bismillāh, Allāhu Akbar”, then begin with the Kaaba on your left. Men walk briskly (raml) — this is the first of three raml rounds.', note: 'Between the Yemeni Corner and the Black Stone, recite the du‘a below.' },
      uz_latin: { title: '1-aylanish', instructions: 'Qora Toshdan boshlang. Unga yuzlanib, qo‘llaringizni ko‘tarib “Bismillah, Allohu Akbar” deng, so‘ng Ka‘bani chap tomoningizda qoldirib boshlang. Erkaklar tez yuradi (raml) — bu uchta raml aylanishning birinchisi.', note: 'Yamaniy burchak bilan Qora Tosh orasida quyidagi duoni o‘qing.' },
      uz_cyr: { title: '1-айланиш', instructions: 'Қора Тошдан бошланг. Унга юзланиб, қўлларингизни кўтариб “Бисмиллаҳ, Аллоҳу Акбар” денг, сўнг Каъбани чап томонингизда қолдириб бошланг. Эркаклар тез юради (рамл) — бу учта рамл айланишнинг биринчиси.', note: 'Ямоний бурчак билан Қора Тош орасида қуйидаги дуони ўқинг.' },
      ru: { title: 'Круг 1', instructions: 'Начните у Чёрного камня. Повернитесь к нему, поднимите руки и скажите «Бисмиллях, Аллаху Акбар», затем идите, держа Каабу слева. Мужчины идут быстрым шагом (рамаль) — это первый из трёх кругов рамаля.', note: 'Между Йеменским углом и Чёрным камнем читайте дуа ниже.' },
    },
  },
  {
    sort_order: 2,
    translations: {
      en: { title: 'Circuit 2', instructions: 'Begin again at the Black Stone with istilām — point to it and say “Allāhu Akbar”. Continue at a brisk pace (raml). Touch the Yemeni Corner if you can reach it without crowding others.', note: 'Do not kiss the Yemeni Corner; touching it is enough.' },
      uz_latin: { title: '2-aylanish', instructions: 'Yana Qora Toshdan istilom bilan boshlang — unga ishora qilib “Allohu Akbar” deng. Tez yurishda (raml) davom eting. Imkon bo‘lsa, boshqalarga xalaqit bermay Yamaniy burchakka qo‘l tegizing.', note: 'Yamaniy burchakni o‘pmang; unga qo‘l tegizish kifoya.' },
      uz_cyr: { title: '2-айланиш', instructions: 'Яна Қора Тошдан истилом билан бошланг — унга ишора қилиб “Аллоҳу Акбар” денг. Тез юришда (рамл) давом этинг. Имкон бўлса, бошқаларга халақит бермай Ямоний бурчакка қўл тегизинг.', note: 'Ямоний бурчакни ўпманг; унга қўл тегизиш кифоя.' },
      ru: { title: 'Круг 2', instructions: 'Снова начните у Чёрного камня с истиляма — укажите на него и скажите «Аллаху Акбар». Продолжайте быстрым шагом (рамаль). Коснитесь Йеменского угла, если можете, не тесня других.', note: 'Йеменский угол не целуют; достаточно коснуться.' },
    },
  },
  {
    sort_order: 3,
    translations: {
      en: { title: 'Circuit 3', instructions: 'Third and final raml round. Salute the Black Stone at the start, then keep the brisk pace. After this round the brisk walking ends and you continue normally.', note: null },
      uz_latin: { title: '3-aylanish', instructions: 'Uchinchi va oxirgi raml aylanishi. Boshida Qora Toshga istilom qiling, so‘ng tez yurishni saqlang. Shu aylanishdan keyin tez yurish tugaydi, oddiy davom etasiz.', note: null },
      uz_cyr: { title: '3-айланиш', instructions: 'Учинчи ва охирги рамл айланиши. Бошида Қора Тошга истилом қилинг, сўнг тез юришни сақланг. Шу айланишдан кейин тез юриш тугайди, оддий давом этасиз.', note: null },
      ru: { title: 'Круг 3', instructions: 'Третий и последний круг рамаля. В начале поприветствуйте Чёрный камень, затем сохраняйте быстрый шаг. После этого круга быстрая ходьба заканчивается, дальше идёте обычно.', note: null },
    },
  },
  {
    sort_order: 4,
    translations: {
      en: { title: 'Circuit 4', instructions: 'From now walk at your normal, calm pace. Begin at the Black Stone with “Allāhu Akbar” and make du‘a freely in any language.', note: null },
      uz_latin: { title: '4-aylanish', instructions: 'Endi oddiy, xotirjam qadamda yuring. Qora Toshdan “Allohu Akbar” bilan boshlang va istalgan tilda erkin duo qiling.', note: null },
      uz_cyr: { title: '4-айланиш', instructions: 'Энди оддий, хотиржам қадамда юринг. Қора Тошдан “Аллоҳу Акбар” билан бошланг ва исталган тилда эркин дуо қилинг.', note: null },
      ru: { title: 'Круг 4', instructions: 'Теперь идите обычным, спокойным шагом. Начните у Чёрного камня со слов «Аллаху Акбар» и свободно обращайтесь с дуа на любом языке.', note: null },
    },
  },
  {
    sort_order: 5,
    translations: {
      en: { title: 'Circuit 5', instructions: 'Fifth round at a calm pace. Salute the Black Stone and continue, keeping the Kaaba on your left and your heart focused on remembrance.', note: null },
      uz_latin: { title: '5-aylanish', instructions: 'Beshinchi aylanish, xotirjam qadamda. Qora Toshga istilom qilib davom eting, Ka‘bani chap tomoningizda qoldirib, qalbingizni zikrga jalb qiling.', note: null },
      uz_cyr: { title: '5-айланиш', instructions: 'Бешинчи айланиш, хотиржам қадамда. Қора Тошга истилом қилиб давом этинг, Каъбани чап томонингизда қолдириб, қалбингизни зикрга жалб қилинг.', note: null },
      ru: { title: 'Круг 5', instructions: 'Пятый круг в спокойном темпе. Поприветствуйте Чёрный камень и продолжайте, держа Каабу слева, а сердце — в поминании Аллаха.', note: null },
    },
  },
  {
    sort_order: 6,
    translations: {
      en: { title: 'Circuit 6', instructions: 'Sixth round. Keep your heart present in du‘a. Touch the Yemeni Corner if it is easy, and salute the Black Stone at the start.', note: null },
      uz_latin: { title: '6-aylanish', instructions: 'Oltinchi aylanish. Qalbingizni duoda hozir tuting. Oson bo‘lsa Yamaniy burchakka qo‘l tegizing, boshida Qora Toshga istilom qiling.', note: null },
      uz_cyr: { title: '6-айланиш', instructions: 'Олтинчи айланиш. Қалбингизни дуода ҳозир тутинг. Осон бўлса Ямоний бурчакка қўл тегизинг, бошида Қора Тошга истилом қилинг.', note: null },
      ru: { title: 'Круг 6', instructions: 'Шестой круг. Сохраняйте сердце в дуа. Коснитесь Йеменского угла, если это легко, и поприветствуйте Чёрный камень в начале.', note: null },
    },
  },
  {
    sort_order: 7,
    translations: {
      en: { title: 'Circuit 7', instructions: 'Final round. Salute the Black Stone, complete the circuit, then move to pray two rak‘ahs behind Maqām Ibrāhīm.', note: 'This completes the Tawaf.' },
      uz_latin: { title: '7-aylanish', instructions: 'Oxirgi aylanish. Qora Toshga istilom qiling, aylanishni tugating, so‘ng Maqomi Ibrohim ortida ikki rakat namoz o‘qishga o‘ting.', note: 'Shu bilan Tavof tugaydi.' },
      uz_cyr: { title: '7-айланиш', instructions: 'Охирги айланиш. Қора Тошга истилом қилинг, айланишни тугатинг, сўнг Мақоми Иброҳим ортида икки ракат намоз ўқишга ўтинг.', note: 'Шу билан Тавоф тугайди.' },
      ru: { title: 'Круг 7', instructions: 'Последний круг. Поприветствуйте Чёрный камень, завершите круг, затем совершите два ракаата за Макамом Ибрахима.', note: 'На этом Таваф завершается.' },
    },
  },
];

const LANGS = ['en', 'uz_latin', 'uz_cyr', 'ru'] as const;

exports.up = async function (knex: Knex) {
  // Find the Tawaf ritual step (Umrah).
  const tawaf = await knex('rituals')
    .where({ is_deleted: false })
    .andWhere((b) => b.where({ arabic: 'الطواف' }).orWhere({ type: 'umrah', sort_order: 2 }))
    .orderBy('sort_order')
    .first();

  if (!tawaf) return; // rituals not seeded yet — nothing to attach to.

  await knex.transaction(async (trx) => {
    // Idempotent: clear any existing sub-steps for this ritual first.
    await trx('ritual_substeps').where({ ritual_id: tawaf.id }).del();

    for (const c of CIRCUITS) {
      const [sub] = await trx('ritual_substeps')
        .insert({
          ritual_id: tawaf.id,
          sort_order: c.sort_order,
          dua_arabic: DUA_AR,
        })
        .returning('id');
      const substepId = typeof sub === 'object' ? sub.id : sub;

      const rows = LANGS.map((lang) => ({
        substep_id: substepId,
        lang,
        title: c.translations[lang].title,
        instructions: c.translations[lang].instructions,
        dua_transliteration: DUA_TRANSLIT,
        dua_translation: DUA_TR[lang],
        note: c.translations[lang].note,
      }));
      await trx('ritual_substep_translations').insert(rows);
    }
  });
};

exports.down = async function (knex: Knex) {
  const tawaf = await knex('rituals')
    .andWhere((b) => b.where({ arabic: 'الطواف' }).orWhere({ type: 'umrah', sort_order: 2 }))
    .first();
  if (tawaf) {
    await knex('ritual_substeps').where({ ritual_id: tawaf.id }).del();
  }
};
