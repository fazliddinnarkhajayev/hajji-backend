import type { Knex } from 'knex';

/**
 * Seeds the duas that were previously hard-coded mock data in the hajji-guide
 * app, now with full translations (en / ru / uz_latin / uz_cyr).
 *
 * Replaces the earlier English-only auto-seed (migration 034 and its duplicate)
 * for the overlapping duas, cleaning up duplicate rows in the process.
 */

type Lang = 'en' | 'ru' | 'uz_latin' | 'uz_cyr';
type Tr = {
  title?: string;
  situation?: string;
  transliteration?: string;
  translation?: string;
  context?: string;
};
type Seed = {
  category: string;
  arabic: string;
  reference?: string | null;
  sort_order: number;
  translations: Record<Lang, Tr>;
};

const SEEDS: Seed[] = [
  {
    category: 'ihram',
    sort_order: 1,
    arabic:
      'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    reference: 'Sahih Bukhari & Muslim',
    translations: {
      en: {
        title: 'Talbiyah',
        situation: 'From ihram until Tawaf',
        transliteration:
          'Labbayka-llāhumma labbayk, labbayka lā sharīka laka labbayk, inna-l-ḥamda wa-n-niʿmata laka wa-l-mulk, lā sharīka lak',
        translation:
          'Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise and blessings are Yours, and all sovereignty. You have no partner.',
        context:
          'The Talbiyah is the essence of Hajj and Umrah — a declaration of monotheism and submission to Allah.',
      },
      ru: {
        title: 'Тальбия',
        situation: 'От ихрама до Тавафа',
        transliteration:
          'Labbayka-llahumma labbayk, labbayka la sharika laka labbayk...',
        translation:
          'Вот я перед Тобой, о Аллах, вот я перед Тобой. Вот я перед Тобой, у Тебя нет сотоварища, вот я перед Тобой. Поистине, вся хвала и милость принадлежат Тебе, и владычество. У Тебя нет сотоварища.',
        context:
          'Тальбия — суть Хаджа и Умры, провозглашение единобожия и покорности Аллаху.',
      },
      uz_latin: {
        title: 'Talbiya',
        situation: 'Ihromdan Tavofgacha',
        transliteration:
          'Labbayka-llohumma labbayk, labbayka la sharika laka labbayk...',
        translation:
          'Labbayka, ey Alloh, mana men. Sening sheriging yo‘q, mana men. Albatta, barcha hamd va ne’mat Senikidir, mulk ham. Sening sheriging yo‘q.',
        context:
          'Talbiya — Haj va Umraning mohiyati, tavhid va Allohga bo‘ysunish e’loni.',
      },
      uz_cyr: {
        title: 'Талбия',
        situation: 'Иҳромдан Тавофгача',
        transliteration:
          'Labbayka-llohumma labbayk, labbayka la sharika laka labbayk...',
        translation:
          'Labbayka, эй Аллоҳ, мана мен. Сенинг шеригинг йўқ, мана мен. Албатта, барча ҳамд ва неъмат Сеникидир, мулк ҳам. Сенинг шеригинг йўқ.',
        context:
          'Талбия — Ҳаж ва Умранинг моҳияти, тавҳид ва Аллоҳга бўйсуниш эълони.',
      },
    },
  },
  {
    category: 'general',
    sort_order: 2,
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    reference: 'Sahih Muslim',
    translations: {
      en: {
        title: 'Entering Masjid al-Haram',
        situation: 'When you first see the Kaaba',
        transliteration: 'Allāhumma-ftaḥ lī abwāba raḥmatik',
        translation: 'O Allah, open to me the gates of Your mercy.',
      },
      ru: {
        title: 'Вход в Масджид аль-Харам',
        situation: 'Когда впервые видите Каабу',
        transliteration: 'Allahumma-ftah li abwaba rahmatik',
        translation: 'О Аллах, открой мне врата Твоей милости.',
      },
      uz_latin: {
        title: 'Masjid al-Haramga kirish',
        situation: 'Ka‘bani birinchi ko‘rganingizda',
        transliteration: 'Allahumma-ftah li abwaba rahmatik',
        translation: 'Allohim, rahmating eshiklarini menga och.',
      },
      uz_cyr: {
        title: 'Масжид ал-Ҳарамга кириш',
        situation: 'Каъбани биринчи кўрганингизда',
        transliteration: 'Allahumma-ftah li abwaba rahmatik',
        translation: 'Аллоҳим, раҳматинг эшикларини менга оч.',
      },
    },
  },
  {
    category: 'tawaf',
    sort_order: 3,
    arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَر',
    reference: null,
    translations: {
      en: {
        title: 'Beginning Tawaf',
        situation: 'At the Black Stone, each circuit',
        transliteration: 'Bismillāhi wa-llāhu akbar',
        translation: 'In the name of Allah, and Allah is the greatest.',
      },
      ru: {
        title: 'Начало Тавафа',
        situation: 'У Чёрного камня, на каждом круге',
        transliteration: 'Bismillahi wa-llahu akbar',
        translation: 'С именем Аллаха, Аллах велик.',
      },
      uz_latin: {
        title: 'Tavofni boshlash',
        situation: 'Qora Tosh yonida, har aylanishda',
        transliteration: 'Bismillahi wa-llahu akbar',
        translation: 'Alloh nomi bilan, Alloh buyukdir.',
      },
      uz_cyr: {
        title: 'Тавофни бошлаш',
        situation: 'Қора Тош ёнида, ҳар айланишда',
        transliteration: 'Bismillahi wa-llahu akbar',
        translation: 'Аллоҳ номи билан, Аллоҳ буюкдир.',
      },
    },
  },
  {
    category: 'tawaf',
    sort_order: 4,
    arabic:
      'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    reference: "Qur'an 2:201",
    translations: {
      en: {
        title: 'Between the Yemeni Corner and the Black Stone',
        situation: 'During Tawaf',
        transliteration:
          'Rabbanā ātinā fid-dunyā ḥasanatan wa fil-ākhirati ḥasanatan wa qinā ʿadhāban-nār',
        translation:
          'Our Lord, give us good in this world and good in the Hereafter, and protect us from the torment of the Fire.',
        context:
          'Recited in the final stretch of each of the seven circuits — one of the most beloved supplications during Tawaf.',
      },
      ru: {
        title: 'Между Йеменским углом и Чёрным камнем',
        situation: 'Во время Тавафа',
        transliteration:
          'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
        translation:
          'Господь наш, дай нам благо в этом мире и благо в Последней жизни и защити нас от мучений Огня.',
        context:
          'Читается на последнем участке каждого из семи кругов. Одно из самых любимых дуа во время Тавафа.',
      },
      uz_latin: {
        title: 'Yamaniy burchak va Qora Tosh orasida',
        situation: 'Tavof paytida',
        transliteration:
          'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
        translation:
          'Robbimiz, bizga dunyoda ham yaxshilik, oxiratda ham yaxshilik ber va bizni do‘zax azobidan saqla.',
        context:
          'Yetti aylanishning har biridagi so‘nggi qismda o‘qiladi. Tavofdagi eng sevimli duolardan biri.',
      },
      uz_cyr: {
        title: 'Яманий бурчак ва Қора Тош орасида',
        situation: 'Тавоф пайтида',
        transliteration:
          'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar',
        translation:
          'Роббимиз, бизга дунёда ҳам яхшилик, охиратда ҳам яхшилик бер ва бизни дўзах азобидан сақла.',
        context:
          'Етти айланишнинг ҳар биридаги сўнгги қисмда ўқилади. Тавофдаги энг севимли дуолардан бири.',
      },
    },
  },
  {
    category: 'tawaf',
    sort_order: 5,
    arabic: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى',
    reference: "Qur'an 2:125",
    translations: {
      en: {
        title: 'After Tawaf at Maqam Ibrahim',
        situation: 'Two rakahs of prayer',
        transliteration: 'Wattakhidhū min maqāmi Ibrāhīma muṣallā',
        translation: 'And take the Station of Ibrahim as a place of prayer.',
      },
      ru: {
        title: 'После Тавафа у Макама Ибрахима',
        situation: 'Два ракаата молитвы',
        transliteration: 'Wattakhidhu min maqami Ibrahima musalla',
        translation: 'И сделайте местом молитвы место стояния Ибрахима.',
      },
      uz_latin: {
        title: 'Tavofdan keyin Maqomi Ibrohimda',
        situation: 'Ikki rakat namoz',
        transliteration: 'Wattakhidhu min maqami Ibrahima musalla',
        translation: 'Ibrohim maqomini namozgoh qilib oling.',
      },
      uz_cyr: {
        title: 'Тавофдан кейин Мақоми Иброҳимда',
        situation: 'Икки ракат намоз',
        transliteration: 'Wattakhidhu min maqami Ibrahima musalla',
        translation: 'Иброҳим мақомини намозгоҳ қилиб олинг.',
      },
    },
  },
  {
    category: 'zamzam',
    sort_order: 6,
    arabic:
      'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا، وَرِزْقًا وَاسِعًا، وَشِفَاءً مِنْ كُلِّ دَاءٍ',
    reference: 'Sunan Ibn Majah',
    translations: {
      en: {
        title: 'Drinking Zamzam',
        situation: 'Before each sip',
        transliteration:
          "Allāhumma innī as'aluka ʿilman nāfiʿan, wa rizqan wāsiʿan, wa shifā'an min kulli dā'",
        translation:
          'O Allah, I ask You for beneficial knowledge, abundant provision, and healing from every disease.',
      },
      ru: {
        title: 'Питьё Замзама',
        situation: 'Перед каждым глотком',
        transliteration:
          "Allahumma inni as'aluka 'ilman nafi'an, wa rizqan wasi'an, wa shifa'an min kulli da'",
        translation:
          'О Аллах, я прошу у Тебя полезного знания, обильного удела и исцеления от всякой болезни.',
      },
      uz_latin: {
        title: 'Zamzam ichish',
        situation: 'Har qultumdan oldin',
        transliteration:
          "Allohumma inni as'aluka ilman nafian, wa rizqan wasian, wa shifaan min kulli da'",
        translation:
          'Allohim, Sendan foydali ilm, keng rizq va har bir darddan shifo so‘rayman.',
      },
      uz_cyr: {
        title: 'Замзам ичиш',
        situation: 'Ҳар қултумдан олдин',
        transliteration:
          "Allohumma inni as'aluka ilman nafian, wa rizqan wasian, wa shifaan min kulli da'",
        translation:
          'Аллоҳим, Сендан фойдали илм, кенг ризқ ва ҳар бир дарддан шифо сўрайман.',
      },
    },
  },
  {
    category: 'sai',
    sort_order: 7,
    arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
    reference: "Qur'an 2:158",
    translations: {
      en: {
        title: 'On the hills of Safa and Marwah',
        situation: "During Sa'i",
        transliteration: "Inna-ṣ-ṣafā wal-marwata min shaʿā'iri-llāh",
        translation: 'Indeed, Safa and Marwah are among the symbols of Allah.',
      },
      ru: {
        title: 'На холмах Сафа и Марва',
        situation: 'Во время Сая',
        transliteration: "Inna-s-safa wal-marwata min sha'a'iri-llah",
        translation:
          'Воистину, Сафа и Марва — одни из обрядовых знамений Аллаха.',
      },
      uz_latin: {
        title: 'Safo va Marva tepaliklarida',
        situation: 'Sa‘y paytida',
        transliteration: "Inna-s-safa wal-marwata min sha'a'iri-llah",
        translation: 'Albatta, Safo va Marva Allohning (dini) belgilaridandir.',
      },
      uz_cyr: {
        title: 'Сафо ва Марва тепаликларида',
        situation: 'Саъй пайтида',
        transliteration: "Inna-s-safa wal-marwata min sha'a'iri-llah",
        translation: 'Албатта, Сафо ва Марва Аллоҳнинг (дини) белгиларидандир.',
      },
    },
  },
];

exports.up = async function (knex: Knex) {
  // Idempotency guard (this repo has had duplicate-numbered migrations before).
  const already = await knex('dua_translations')
    .where({ lang: 'ru', title: 'Тальбия' })
    .first();
  if (already) return;

  // Remove the old English-only auto-seeded duas (and any duplicate copies)
  // these replace. Cascade drops their translations.
  await knex('duas')
    .whereIn('title', [
      'Talbiyah',
      'Entering Masjid al-Haram',
      'Beginning Tawaf',
      'Dua at Safa and Marwah',
    ])
    .delete();

  for (const s of SEEDS) {
    const [row] = await knex('duas')
      .insert({
        category: s.category,
        arabic: s.arabic,
        reference: s.reference ?? null,
        sort_order: s.sort_order,
      })
      .returning('id');
    const duaId = typeof row === 'object' ? row.id : row;

    const translationRows = (Object.entries(s.translations) as [Lang, Tr][]).map(
      ([lang, t]) => ({
        dua_id: duaId,
        lang,
        title: t.title ?? null,
        situation: t.situation ?? null,
        transliteration: t.transliteration ?? null,
        translation: t.translation ?? null,
        context: t.context ?? null,
      }),
    );
    await knex('dua_translations').insert(translationRows);
  }
};

exports.down = async function (knex: Knex) {
  const arabics = SEEDS.map((s) => s.arabic);
  await knex('duas').whereIn('arabic', arabics).delete();
};
