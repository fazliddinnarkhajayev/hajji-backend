import type { Knex } from 'knex';

/**
 * Journey duas from "САФАРНИ БОШЛАШДА ЎҚИЛАДИГАН ДУО" (uz_cyr source document):
 * setting out, boarding, flying over water, during the journey, Umrah ihram
 * intention, entering the Haram, entering Masjid al-Haram, first sight of the Kaaba.
 *
 * - uz_cyr text is taken from the document as-is.
 * - uz_latin is converted mechanically from uz_cyr (see `toLatin`).
 * - en / ru are draft translations and should be reviewed by a scholar.
 * - "Entering Masjid al-Haram" already exists (migration 055) in a shorter form
 *   with a wrong `situation`; it is updated in place instead of duplicated.
 * - Existing duas are renumbered so the list follows the order of the journey.
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
  reference: string;
  sort_order: number;
  translations: Record<Exclude<Lang, 'uz_latin'>, Tr>;
};

// ---------------------------------------------------------------------------
// uz_cyr -> uz_latin
// ---------------------------------------------------------------------------

const CYR_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ё: 'yo', ж: 'j', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's',
  т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '’', ы: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o‘', қ: 'q',
  ғ: 'g‘', ҳ: 'h',
};
const VOWELS = new Set('аеёиоуўэюяАЕЁИОУЎЭЮЯ');

function toLatin(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const lower = ch.toLowerCase();
    const isUpper = ch !== lower;
    let lat: string;
    if (lower === 'е') {
      // "е" is "ye" at the start of a word and after a vowel / ъ / ь
      // (but a doubled "ее", a long vowel in transliterations, stays "ee").
      const prev = i > 0 ? text[i - 1] : '';
      const wordStart = !prev || !/[\p{L}]/u.test(prev);
      const afterVowel = VOWELS.has(prev) && prev.toLowerCase() !== 'е';
      lat = wordStart || afterVowel || 'ъьЪЬ'.includes(prev) ? 'ye' : 'e';
    } else if (lower in CYR_TO_LAT) {
      lat = CYR_TO_LAT[lower];
    } else {
      out += ch;
      continue;
    }
    if (isUpper && lat) {
      const next = i + 1 < text.length ? text[i + 1] : '';
      const allCaps = next !== '' && next !== next.toLowerCase();
      lat = allCaps ? lat.toUpperCase() : lat[0].toUpperCase() + lat.slice(1);
    }
    out += lat;
  }
  return out;
}

function withLatin(t: Seed['translations']): Record<Lang, Tr> {
  const c = t.uz_cyr;
  const conv = (s?: string) => (s == null ? undefined : toLatin(s));
  return {
    ...t,
    uz_latin: {
      title: conv(c.title),
      situation: conv(c.situation),
      transliteration: conv(c.transliteration),
      translation: conv(c.translation),
      context: conv(c.context),
    },
  };
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

const MASJID_OLD_ARABIC = 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ';

const MASJID: Seed = {
  category: 'haram',
  sort_order: 9,
  arabic:
    'بِسمِ الله والصلوة والسَّلامُ عَلَى رَسُولِ الله ، اللهمّ اغفِر لِي ذُنُوبِي ، وافتَح لِي أَبواب رَحمَتِك.',
  reference: 'Ibn Majah, Sunan at-Tirmidhi',
  translations: {
    en: {
      title: 'Entering Masjid al-Haram',
      situation: 'When entering Masjid al-Haram — step in with the right foot first',
      transliteration:
        'Bismillāhi wa-ṣ-ṣalātu wa-s-salāmu ʿalā rasūli-llāh. Allāhumma-ghfir lī dhunūbī wa-ftaḥ lī abwāba raḥmatik',
      translation:
        'In the name of Allah, and peace and blessings be upon the Messenger of Allah. O Allah, forgive me my sins and open for me the gates of Your mercy.',
    },
    ru: {
      title: 'Вход в Масджид аль-Харам',
      situation: 'При входе в Масджид аль-Харам — входите с правой ноги',
      transliteration:
        'Bismillāhi wa-ṣ-ṣalātu wa-s-salāmu ʿalā rasūli-llāh. Allāhumma-ghfir lī dhunūbī wa-ftaḥ lī abwāba raḥmatik',
      translation:
        'С именем Аллаха, мир и благословение посланнику Аллаха. О Аллах, прости мне мои грехи и открой мне врата Твоей милости.',
    },
    uz_cyr: {
      title: 'Масжидул Ҳаромга кириш',
      situation: 'Масжидул Ҳаромга аввал ўнг оёқни қўйиб киришда',
      transliteration:
        'Бисмиллааҳи, вас солаату вас-салааму ъалаа расулиллааҳ. Аллоҳуммағфир лий зунуубий, вафтаҳ лий абвааба роҳматик',
      translation:
        'Аллоҳнинг номи билан (кираман). Аллоҳнинг Расулига салавоту саломлар бўлсин. Аллоҳим! Гуноҳларимни мағфират қилгин ва менга раҳмат эшикларингни очгин.',
    },
  },
};

const SEEDS: Seed[] = [
  {
    category: 'travel',
    sort_order: 1,
    arabic: 'بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ ، لا حَوْلَ وَلا قُوَّةَ إِلا بِاللهِ .',
    reference: 'Sunan at-Tirmidhi',
    translations: {
      en: {
        title: 'Setting out on a journey',
        situation: 'When leaving home for the journey',
        transliteration: 'Bismillāhi tawakkaltu ʿala-llāh, lā ḥawla wa lā quwwata illā billāh',
        translation:
          'In the name of Allah (I set out). I put my trust in Allah. There is no power and no strength except with Allah.',
      },
      ru: {
        title: 'При выходе в путь',
        situation: 'При выходе из дома в путь',
        transliteration: 'Bismillāhi tawakkaltu ʿala-llāh, lā ḥawla wa lā quwwata illā billāh',
        translation:
          'С именем Аллаха (отправляюсь в путь). Уповаю на Аллаха. Нет мощи и силы ни у кого, кроме Аллаха.',
      },
      uz_cyr: {
        title: 'Сафарни бошлашда ўқиладиган дуо',
        situation: 'Уйдан сафарга чиқаётганда',
        transliteration:
          'Бисмиллааҳи таваккалту ъалаллоҳи, лаа ҳавла ва лаа қуввата иллаа биллааҳ',
        translation:
          'Аллоҳнинг номи билан (сафарни бошлайман), Аллоҳга таваккал қилдим. Тоатга қувват ва гуноҳдан сақланишга бўлган қувват ҳам ёлғиз Аллоҳ таоло томонидандир.',
      },
    },
  },
  {
    category: 'travel',
    sort_order: 2,
    arabic: 'اللَّهُمَّ بِكَ أَصُولُ وَبِكَ أَحُولُ وَبِكَ أَسِيرُ',
    reference: 'Musnad Ahmad',
    translations: {
      en: {
        title: "Seeking Allah's help when setting out",
        situation: 'When leaving home for the journey',
        transliteration: 'Allāhumma bika aṣūlu, wa bika aḥūlu, wa bika asīr',
        translation:
          'O Allah, by Your help I strive, by Your help I keep away from sin, and by Your help I set out on my journey.',
      },
      ru: {
        title: 'Мольба о помощи в начале пути',
        situation: 'При выходе из дома в путь',
        transliteration: 'Allāhumma bika aṣūlu, wa bika aḥūlu, wa bika asīr',
        translation:
          'О Аллах! С Твоей помощью я стремлюсь, с Твоей помощью удерживаюсь от греха и с Твоей помощью отправляюсь в путь.',
      },
      uz_cyr: {
        title: 'Сафарга чиқишда Аллоҳдан мадад сўраш',
        situation: 'Уйдан сафарга чиқаётганда',
        transliteration: 'Аллоҳумма, бика асуулу, ва бика аҳуулу, ва бика асийру',
        translation:
          'Аллоҳим! Сенинг мададинг ила ҳимматланаман, Сенинг мададинг ила гуноҳдан тийиламан, Сенинг мададинг ила сафарга чиқаман.',
      },
    },
  },
  {
    category: 'travel',
    sort_order: 3,
    arabic:
      'سُبْحَانَ الّذِي سَخّرَ لَنَا هَذَا وَمَا كُنّا لَهُ مُقْرِنِينَ وَإِنّا إِلَىَ رَبّنَا لَمُنْقَلِبُونَ.',
    reference: 'Az-Zukhruf 43:13–14; Sahih Muslim, Sunan at-Tirmidhi',
    translations: {
      en: {
        title: 'Boarding a plane or vehicle',
        situation: 'When stepping onto the plane or any vehicle — say "Bismillah" first',
        transliteration:
          'Subḥāna-lladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn, wa innā ilā rabbinā la-munqalibūn',
        translation:
          'Glory be to Him who has made this subservient to us, for we could never have done it ourselves. And indeed, to our Lord we shall return.',
      },
      ru: {
        title: 'При посадке в самолёт или транспорт',
        situation: 'Ступая на трап самолёта или в транспорт — сначала скажите «Бисмиллях»',
        transliteration:
          'Subḥāna-lladhī sakhkhara lanā hādhā wa mā kunnā lahu muqrinīn, wa innā ilā rabbinā la-munqalibūn',
        translation:
          'Пречист Тот, Кто подчинил нам это, ведь сами мы не были на это способны. И, поистине, мы вернёмся к нашему Господу.',
      },
      uz_cyr: {
        title: 'Самолёт ёки транспортга минганда',
        situation:
          'Самолёт трапига (зинапоясига) ёки бошқа транспорт воситасига қадам қўйган пайтда басмалани айтиб ўқилади',
        transliteration:
          'Субҳааналлазий саххоро ланаа ҳаазаа, ва маа куннаа лаҳу муқринийн. Ва иннаа илаа Роббинаа ламунқолибуун',
        translation:
          'Бизга буни хизматкор қилиб қўйган Зот покдир. Бунга қодир эмас эдик. Ва албатта, биз Роббимизга қайтувчилардирмиз.',
      },
    },
  },
  {
    category: 'travel',
    sort_order: 4,
    arabic:
      'بِسْمِ اللَّهِ مَجْرَاهَا وَمُرْسَاهَا إِنَّ رَبِّي لَغَفُورٌ رَحِيمٌ\n' +
      'وَمَا قَدَرُوا اللَّهَ حَقَّ قَدْرِهِ وَالْأَرْضُ جَمِيعًا قَبْضَتُهُ يَوْمَ الْقِيَامَةِ وَالسَّمَاوَاتُ مَطْوِيَّاتٌ بِيَمِينِهِ سُبْحَانَهُ وَتَعَالَى عَمَّا يُشْرِكُونَ',
    reference: 'Hud 11:41; Az-Zumar 39:67; Hisn al-Hasin',
    translations: {
      en: {
        title: 'Flying over water',
        situation: 'When the plane flies over a river or sea',
        transliteration:
          'Bismillāhi majrāhā wa mursāhā, inna rabbī la-ghafūrun raḥīm.\n' +
          'Wa mā qadaru-llāha ḥaqqa qadrihi wa-l-arḍu jamīʿan qabḍatuhu yawma-l-qiyāmati wa-s-samāwātu maṭwiyyātun bi-yamīnih, subḥānahu wa taʿālā ʿammā yushrikūn',
        translation:
          'In the name of Allah is its course and its anchorage. Indeed, my Lord is Forgiving and Merciful (Hud, 41).\n' +
          'They have not appraised Allah with His true worth, while on the Day of Resurrection the whole earth will be within His grip and the heavens will be folded in His right hand. Glorified and exalted is He above what they associate with Him (Az-Zumar, 67).',
      },
      ru: {
        title: 'При пролёте над водой',
        situation: 'Когда самолёт пролетает над рекой или морем',
        transliteration:
          'Bismillāhi majrāhā wa mursāhā, inna rabbī la-ghafūrun raḥīm.\n' +
          'Wa mā qadaru-llāha ḥaqqa qadrihi wa-l-arḍu jamīʿan qabḍatuhu yawma-l-qiyāmati wa-s-samāwātu maṭwiyyātun bi-yamīnih, subḥānahu wa taʿālā ʿammā yushrikūn',
        translation:
          'С именем Аллаха его плавание и стоянка. Поистине, мой Господь — Прощающий, Милосердный (Худ, 41).\n' +
          'Они не оценили Аллаха должным образом, тогда как в День воскресения вся земля будет в Его горсти, а небеса будут свёрнуты в Его деснице. Пречист Он и превыше того, что они приобщают к Нему в сотоварищи (Аз-Зумар, 67).',
      },
      uz_cyr: {
        title: 'Дарё устидан учиб ўтаётганда',
        situation: 'Самолётда сафар давомида дарё устидан учиб ўтаётган пайтда',
        transliteration:
          'Бисмиллааҳи мажрееҳаа ва мурсааҳаа. Инна Роббий лағофуурур роҳийм.\n' +
          'Ва маа қодаруллоҳа ҳаққо қодриҳи вал арду жамийъан қобдотуҳу явмал қийаамати вас самааваату матвиййаатун бийамийниҳи субҳаанаҳу ва таъаалаа ъаммаа йушрикуун',
        translation:
          '...Унинг юриши ҳам, туриши ҳам Аллоҳнинг номи ила. Албатта, Роббим ўта мағфиратлидир, ўта раҳмлидир (Ҳуд сураси, 41-оят).\n' +
          'Аллоҳни Ўзига лойиқ қадрламадилар. Ҳолбуки, қиёмат куни ер борлигича Унинг сиқимидадир. Осмонлар эса Унинг қудрат қўлига йиғилгандир. У Зот улар ширк келтираётган нарсалардан пок ва олийдир (Зумар сураси, 67-оят).',
      },
    },
  },
  {
    category: 'travel',
    sort_order: 5,
    arabic:
      'اللَّهُمَّ هَوّن عَلَيْنا سَفَرَنَا هَذَا، وَاطْوِ عَنّا بُعْدَهُ . اللَّهُمَّ أنْتَ الصَّاحِبُ فِي السَّفَرِ وَالخَلِيفَةُ في الأهْلِ . اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ وَعْثَاءِ السَّفَرِ وَكَآبَةِ الْمُنْقَلَبِ وَسُوءِ الْمَنْظَرِ فِي الأَهْلِ وَالْمَالِ.',
    reference: 'Sunan at-Tirmidhi',
    translations: {
      en: {
        title: 'During the journey',
        situation: 'Throughout the journey',
        transliteration:
          'Allāhumma hawwin ʿalaynā safaranā hādhā, waṭwi ʿannā buʿdah. Allāhumma anta-ṣ-ṣāḥibu fi-s-safari wa-l-khalīfatu fi-l-ahl. Allāhumma innī aʿūdhu bika min waʿthāʾi-s-safari wa kaʾābati-l-munqalabi wa sūʾi-l-manẓari fi-l-ahli wa-l-māl',
        translation:
          'O Allah, make this journey of ours easy for us and shorten its distance for us. O Allah, You are the Companion on the journey and the Guardian of the family. O Allah, I seek refuge in You from the hardships of travel, from distressing sights, and from returning to find harm in my family and property.',
      },
      ru: {
        title: 'Во время пути',
        situation: 'На протяжении всего пути',
        transliteration:
          'Allāhumma hawwin ʿalaynā safaranā hādhā, waṭwi ʿannā buʿdah. Allāhumma anta-ṣ-ṣāḥibu fi-s-safari wa-l-khalīfatu fi-l-ahl. Allāhumma innī aʿūdhu bika min waʿthāʾi-s-safari wa kaʾābati-l-munqalabi wa sūʾi-l-manẓari fi-l-ahli wa-l-māl',
        translation:
          'О Аллах, облегчи нам это путешествие и сократи для нас его расстояние. О Аллах, Ты — Спутник в пути и Хранитель семьи. О Аллах, прибегаю к Тебе от тягот пути, от удручающего зрелища и от дурного возвращения к семье и имуществу.',
      },
      uz_cyr: {
        title: 'Сафар давомида ўқиладиган дуо',
        situation: 'Сафар давомида',
        transliteration:
          'Аллоҳумма, ҳаввин ъалайнаа сафаронаа ҳазаа, ватви ъаннаа буъдаҳу. Аллоҳумма, антас-соҳибу фис-сафари вал холийфату фил аҳли. Аллоҳумма, инний аъуузу бика мин ваъсааис-сафари ва каъабатил мунқолаби ва сууъил манзори фил аҳли вал маъаали',
        translation:
          'Аллоҳим! Сафаримизни ўзимизга енгил қилгин, узоғини яқин қилгин. Аллоҳим! Сафардаги соҳибим Ўзингсан, сафардалигимда аҳлимни ҳифзу ҳимоянгга олгувчисан. Аллоҳим! Сафарнинг машаққатидан, ғамга солувчи манзара(га дучор бўлиш)дан, уйга – ўз аҳлимга, молимга ва фарзандларимга қайтиб келганимда ёмон ҳолатга дучор бўлишдан Ўзингдан паноҳ сўрайман.',
      },
    },
  },
  {
    category: 'ihram',
    sort_order: 6,
    arabic: 'اللَّهُمَّ إنِّي أُرِيدُ الْعُمْرَةَ فَيَسِّرْهَا لِي، وَتَقَبَّلْهَا مِنِّي.',
    reference: "Bada'i as-Sana'i",
    translations: {
      en: {
        title: 'Intention of Umrah ihram',
        situation: 'When entering ihram with the intention of Umrah',
        transliteration: 'Allāhumma innī urīdu-l-ʿumrata fa-yassirhā lī wa taqabbalhā minnī',
        translation: 'O Allah, I intend to perform Umrah, so make it easy for me and accept it from me.',
      },
      ru: {
        title: 'Намерение ихрама для Умры',
        situation: 'При вступлении в ихрам с намерением Умры',
        transliteration: 'Allāhumma innī urīdu-l-ʿumrata fa-yassirhā lī wa taqabbalhā minnī',
        translation: 'О Аллах, я намереваюсь совершить Умру, облегчи её для меня и прими её от меня.',
      },
      uz_cyr: {
        title: 'Умра эҳромининг дуоси',
        situation: 'Умра қилмоқчи бўлган киши эҳромга киришда',
        transliteration: 'Аллоҳумма, инний урийдул умрота, фа йассирҳаа лий ва тақоббалҳаа минний',
        translation: 'Аллоҳим! Умра қилишни ирода қилдим. Уни менга осон қилгин ва уни мендан қабул қилгин.',
      },
    },
  },
  {
    category: 'haram',
    sort_order: 8,
    arabic:
      'اَللَّهُمَّ إنَّ هَذا حَرَمُكَ وَحَرَمُ رَسُولِكَ فَحَرِّم لَحمِي وَدَمِي وعظمي وبشري عَلى النَّارِ اَللَّهُمَّ آمنِّي مِن عَذابِكَ يَومَ تَبعَثُ عِبادَكَ.',
    reference: "Tabyin al-Haqa'iq, Qadikhan, Ghunya",
    translations: {
      en: {
        title: 'Entering the Haram boundary',
        situation: 'When crossing into the boundary of the Haram',
        transliteration:
          'Allāhumma inna hādhā ḥaramuka wa ḥaramu rasūlik, fa-ḥarrim laḥmī wa damī wa ʿaẓmī wa basharī ʿala-n-nār. Allāhumma āminnī min ʿadhābika yawma tabʿathu ʿibādak',
        translation:
          'O Allah, this is Your sanctuary and the sanctuary of Your Messenger, so make my flesh, my blood, my bones and my skin forbidden to the Fire. O Allah, keep me safe from Your punishment on the Day You resurrect Your servants.',
      },
      ru: {
        title: 'При входе на территорию Харама',
        situation: 'При пересечении границ Харама',
        transliteration:
          'Allāhumma inna hādhā ḥaramuka wa ḥaramu rasūlik, fa-ḥarrim laḥmī wa damī wa ʿaẓmī wa basharī ʿala-n-nār. Allāhumma āminnī min ʿadhābika yawma tabʿathu ʿibādak',
        translation:
          'О Аллах, это Твоё заповедное место и заповедное место Твоего посланника, так запрети же Огню мою плоть, мою кровь, мои кости и мою кожу. О Аллах, убереги меня от Твоего наказания в День, когда Ты воскресишь Своих рабов.',
      },
      uz_cyr: {
        title: 'Ҳарам ҳудудига киришда ўқиладиган дуо',
        situation: 'Ҳарам ҳудудига киришда',
        transliteration:
          'Аллоҳумма, инна ҳаазаа ҳаромука ва ҳарому расулика. Фа ҳаррим лаҳмий ва дамий ва ъазмий ва башарий ъалан-наар. Аллоҳумма, ааминний мин ъазаабика йавма табъасу ъибаадак',
        translation:
          'Аллоҳим! Бу жой Сенинг ва Расулингнинг ҳарамидир. Гўштим, қоним, суягим ва теримни дўзахга ҳаром қилгин. Аллоҳим! Бандаларингни қайта тирилтирадиган Кунда мени азобингдан Ўзинг асрагин!',
      },
    },
  },
  {
    category: 'haram',
    sort_order: 10,
    arabic:
      'اللّهمّ أنت السّلام ، ومنك السّلام ، فحيّنا ربّنا بالسّلام اللّهمّ زد هذا البيت تشريفاً وتكريماً وتعظيماً ومهابةً ، وزد من شرّفه وكرّمه ممّن حجّه واعتمره تشريفاً وتعظيماً وبرّاً.',
    reference: 'Qadikhan, Ahkam al-Hajj',
    translations: {
      en: {
        title: 'First sight of the Kaaba',
        situation: 'When you first see the Kaaba',
        transliteration:
          'Allāhumma anta-s-salāmu wa minka-s-salām, fa-ḥayyinā rabbanā bi-s-salām. Allāhumma zid hādha-l-bayta tashrīfan wa takrīman wa taʿẓīman wa mahābah, wa zid man sharrafahu wa karramahu mimman ḥajjahu wa-ʿtamarahu tashrīfan wa taʿẓīman wa birrā',
        translation:
          'O Allah, You are Peace and from You comes peace, so let us live, our Lord, in peace. O Allah, increase this House in honour, esteem, reverence and awe, and increase those who honour and esteem it, among those who perform Hajj or Umrah to it, in honour, reverence and goodness.',
        context:
          "If you have not memorised this du'a, say its meaning in your own language and humbly ask Allah for what you wish. When Imam Abu Hanifa (may Allah have mercy on him) went for Hajj or Umrah, on first seeing the Kaaba he would say: \"O Allah, answer all the prayers I make on this journey and place me among Your servants whose prayers are answered.\"",
      },
      ru: {
        title: 'При первом взгляде на Каабу',
        situation: 'Когда впервые видите Каабу',
        transliteration:
          'Allāhumma anta-s-salāmu wa minka-s-salām, fa-ḥayyinā rabbanā bi-s-salām. Allāhumma zid hādha-l-bayta tashrīfan wa takrīman wa taʿẓīman wa mahābah, wa zid man sharrafahu wa karramahu mimman ḥajjahu wa-ʿtamarahu tashrīfan wa taʿẓīman wa birrā',
        translation:
          'О Аллах, Ты — Мир, и от Тебя мир, так даруй же нам, Господь наш, жизнь в мире. О Аллах, приумножь этому Дому почёт, уважение, величие и благоговение, и приумножь тем, кто почитает и уважает его из совершающих к нему Хадж или Умру, почёт, величие и благочестие.',
        context:
          'Если вы не выучили это дуа, произнесите его смысл на родном языке и смиренно попросите у Аллаха желаемое. Имам Абу Ханифа (да помилует его Аллах), отправляясь в Хадж или Умру, при первом взгляде на Каабу говорил: «О Аллах, ответь на все мольбы, что я совершу в этом путешествии, и причисли меня к Твоим рабам, чьи мольбы принимаются».',
      },
      uz_cyr: {
        title: 'Байтуллоҳга илк назар тушганда ўқиладиган дуо',
        situation: 'Каъбага илк назар тушганда',
        transliteration:
          'Аллоҳумма, антас-салаам ва минкас-салаам, фаҳаййинаа Роббанаа бис-салаам. Аллоҳумма, зид ҳаазаал байта ташрийфан ва такрийман ва таъзийман ва маҳаабатан. Ва зид ман шаррофаҳу ва карромаҳу мимман ҳажжаҳу ваътамароҳу ташрийфан ва таъзийман ва биррон',
        translation:
          'Аллоҳим! Сен Ўзинг саломсан. Саломатлик ҳам Сендандир. Эй Роббимиз! Бизларни саломатликда ҳаёт кечиртиргин! Аллоҳим! Бу Байтингнинг таъзими, шарафи, икроми ва ҳайбатини зиёда қилгин. Уни ҳаж ёки умра қилувчининг шарафи, икроми, таъзими ва савобини ҳам зиёда қилгин.',
        context:
          'Ушбу дуони ёд олмаган бўлса, ўз она тилида ушбу дуонинг маъносини айтиб, тазарруъ ила Аллоҳ таолодан муродини сўрайди. Имоми Аъзам раҳматуллоҳи алайҳ ҳаж ёки умра сафарига борсалар, Каъбатуллоҳга илк назарлари тушганда: «Аллоҳим! Бу сафаримда қиладиган барча дуоларимни ижобат қилиб, дуоси мустажоб бандаларинг сафида қилгин» дер эдилар.',
      },
    },
  },
];

// Existing duas (migration 055) renumbered to follow the journey order.
// [category, old sort_order, new sort_order]
const RENUMBER: Array<[string, number, number]> = [
  ['ihram', 1, 7], // Talbiyah — right after the ihram intention
  ['tawaf', 3, 11],
  ['tawaf', 4, 12],
  ['tawaf', 5, 13],
  ['zamzam', 6, 14],
  ['sai', 7, 15],
];

// Masjid al-Haram dua as seeded by 055, restored on rollback.
const MASJID_OLD: { category: string; reference: string; sort_order: number; translations: Record<Lang, Tr> } = {
  category: 'general',
  reference: 'Sahih Muslim',
  sort_order: 2,
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
};

// ---------------------------------------------------------------------------

async function writeTranslations(trx: Knex.Transaction, duaId: string, translations: Record<Lang, Tr>) {
  for (const [lang, t] of Object.entries(translations) as [Lang, Tr][]) {
    await trx('dua_translations')
      .insert({
        dua_id: duaId,
        lang,
        title: t.title ?? null,
        situation: t.situation ?? null,
        transliteration: t.transliteration ?? null,
        translation: t.translation ?? null,
        context: t.context ?? null,
      })
      .onConflict(['dua_id', 'lang'])
      .merge(['title', 'situation', 'transliteration', 'translation', 'context', 'updated_at']);
  }
}

exports.up = async function (knex: Knex) {
  // Idempotency guard.
  const already = await knex('duas').where({ arabic: SEEDS[0].arabic, is_deleted: false }).first();
  if (already) return;

  await knex.transaction(async (trx) => {
    for (const [category, from, to] of RENUMBER) {
      await trx('duas').where({ category, sort_order: from, is_deleted: false }).update({ sort_order: to });
    }

    // Upgrade the existing short "Entering Masjid al-Haram" dua, or insert it if missing.
    const masjid = await trx('duas').where({ arabic: MASJID_OLD_ARABIC, is_deleted: false }).first();
    let masjidId: string;
    if (masjid) {
      masjidId = masjid.id;
      await trx('duas').where({ id: masjidId }).update({
        category: MASJID.category,
        arabic: MASJID.arabic,
        reference: MASJID.reference,
        sort_order: MASJID.sort_order,
        updated_at: trx.fn.now(),
      });
    } else {
      const [row] = await trx('duas')
        .insert({
          category: MASJID.category,
          arabic: MASJID.arabic,
          reference: MASJID.reference,
          sort_order: MASJID.sort_order,
        })
        .returning('id');
      masjidId = typeof row === 'object' ? row.id : row;
    }
    await writeTranslations(trx, masjidId, withLatin(MASJID.translations));

    for (const s of SEEDS) {
      const [row] = await trx('duas')
        .insert({
          category: s.category,
          arabic: s.arabic,
          reference: s.reference,
          sort_order: s.sort_order,
        })
        .returning('id');
      const duaId = typeof row === 'object' ? row.id : row;
      await writeTranslations(trx, duaId, withLatin(s.translations));
    }
  });
};

exports.down = async function (knex: Knex) {
  await knex.transaction(async (trx) => {
    await trx('duas')
      .whereIn(
        'arabic',
        SEEDS.map((s) => s.arabic),
      )
      .delete();

    const masjid = await trx('duas').where({ arabic: MASJID.arabic }).first();
    if (masjid) {
      await trx('duas').where({ id: masjid.id }).update({
        category: MASJID_OLD.category,
        arabic: MASJID_OLD_ARABIC,
        reference: MASJID_OLD.reference,
        sort_order: MASJID_OLD.sort_order,
        updated_at: trx.fn.now(),
      });
      await writeTranslations(trx, masjid.id, MASJID_OLD.translations);
    }

    for (const [category, from, to] of RENUMBER) {
      await trx('duas').where({ category, sort_order: to, is_deleted: false }).update({ sort_order: from });
    }
  });
};
