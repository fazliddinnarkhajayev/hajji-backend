import type { Knex } from 'knex';

/**
 * Umrah rituals — full reseed with the du'as from the content files
 * (D:\hajji\content: Тавоф, Саъй, Арафот (soch oldirish), …).
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
 * parentheses moved to `reference`; footnote marks like [3] removed from the
 * Arabic); uz_latin = letter-by-letter Latin of the uz_cyr text; en / ru =
 * translations of it; ru transliteration = the uz_cyr one in Russian letters.
 *
 * Generated — see docs/rituals-duas-seed.md.
 */

type Tr = { title: string | null; transliteration: string | null; translation: string | null; reference: string | null };
type Dua = { dua_arabic: string; translations: Record<string, Tr> };

const STEPS: Array<{ sort_order: number; arabic: string | null; dua_arabic: string | null; translations: Record<string, Record<string, string | null>> }> = [
  {
    "sort_order": 0,
    "arabic": "الإحرام",
    "dua_arabic": "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    "translations": {
      "en": {
        "name": "Ihram",
        "description": "Enter the sacred state of pilgrimage",
        "location": "At the Miqat",
        "duration": "20–30 min",
        "instructions": "Perform ghusl, wear the two white garments, and make your intention (niyyah) for Umrah before crossing the Miqat boundary. From this point, the restrictions of ihram apply.",
        "dua_transliteration": "Labbayka-llāhumma ʿumrah",
        "dua_translation": "Here I am, O Allah, for Umrah."
      },
      "uz_latin": {
        "name": "Ihram",
        "description": "Ziyoratning muqaddas holatiga kiring",
        "location": "Miyqotda",
        "duration": "20-30 daqiqa",
        "instructions": "Gusl qiling, ikki oq kiyimni kiying va Miyqot chegarasidan o‘tishdan oldin Umra niyatini qiling. Shu paytdan boshlab ihram cheklovlari amal qiladi.",
        "dua_transliteration": "Allahumma-ftah li abwaba rahmatik",
        "dua_translation": "Allohim, rahmating eshiklarini menga och."
      },
      "uz_cyr": {
        "name": "Иҳром",
        "description": "Зиёратнинг муқаддас ҳолатига киринг",
        "location": "Мийқотда",
        "duration": "20-30 дақиқа",
        "instructions": "Ғусл қилинг, икки оқ кийимни кийинг ва Мийқот чегарасидан ўтишдан олдин Умра ниятини қилинг.",
        "dua_transliteration": "Allahumma-ftah li abwaba rahmatik",
        "dua_translation": "Аллоҳим, раҳматинг эшикларини менга оч."
      },
      "ru": {
        "name": "Ихрам",
        "description": "Войдите в священное состояние паломничества",
        "location": "У миката",
        "duration": "20-30 мин",
        "instructions": "Совершите гусль, наденьте две белые ткани и сделайте намерение на Умру до пересечения границы миката.",
        "dua_transliteration": "Allahumma-ftah li abwaba rahmatik",
        "dua_translation": "О Аллах, открой мне врата Твоей милости."
      }
    }
  },
  {
    "sort_order": 1,
    "arabic": "التلبية",
    "dua_arabic": "لَبَّيْكَ اللَّهُمَّ لَبَّيْك",
    "translations": {
      "en": {
        "name": "Talbiyah",
        "description": "Recite the pilgrim's response",
        "location": "On the way to Makkah",
        "duration": "Ongoing",
        "instructions": "Repeat the Talbiyah aloud and often as you travel toward the Haram. Men raise their voices; women say it softly. Continue until you begin Tawaf.",
        "dua_transliteration": "Labbayka-llāhumma labbayk, labbayka lā sharīka laka labbayk",
        "dua_translation": "Here I am, O Allah, here I am. You have no partner; here I am."
      },
      "uz_latin": {
        "name": "Talbiya",
        "description": "Ziyoratchining javob duosini ayting",
        "location": "Makkaga yo‘lda",
        "duration": "Davomiy",
        "instructions": "Haram tomon borar ekansiz Talbiyani tez-tez takrorlang. Erkaklar ovozini balandroq, ayollar esa pastroq aytadi. Tavof boshlanguncha davom eting.",
        "dua_transliteration": "Labbayka-llahumma labbayk",
        "dua_translation": "Labbayk, ey Alloh, labbayk."
      },
      "uz_cyr": {
        "name": "Талбия",
        "description": "Зиёратчининг жавоб дуосини айтинг",
        "location": "Маккага йўлда",
        "duration": "Давомий",
        "instructions": "Ҳарам томон борар экансиз Талбияни тез-тез такрорланг.",
        "dua_transliteration": "Labbayka-llahumma labbayk",
        "dua_translation": "Лаббайк, эй Аллоҳ, лаббайк."
      },
      "ru": {
        "name": "Тальбия",
        "description": "Произнесите ответ паломника",
        "location": "По дороге в Мекку",
        "duration": "Постоянно",
        "instructions": "Часто повторяйте Тальбию по пути к Хараму. Продолжайте до начала Тавафа.",
        "dua_transliteration": "Labbayka-llahumma labbayk",
        "dua_translation": "Вот я перед Тобой, о Аллах."
      }
    }
  },
  {
    "sort_order": 2,
    "arabic": "الطواف",
    "dua_arabic": "بِسْمِ اللَّهِ وَاللَّهُ أَكْبَر",
    "translations": {
      "en": {
        "name": "Tawaf",
        "description": "Seven circuits around the Kaaba",
        "location": "Mataf, Masjid al-Haram",
        "duration": "40–60 min",
        "instructions": "Begin at the corner of the Black Stone. Keep the Kaaba on your left and circle anticlockwise seven times. Men do raml (brisk pace) in the first three rounds.",
        "dua_transliteration": "Bismillāhi wa-llāhu akbar, allāhumma īmānan bika",
        "dua_translation": "In the name of Allah, Allah is greatest. O Allah, with faith in You."
      },
      "uz_latin": {
        "name": "Tavof",
        "description": "Ka‘ba atrofida yetti marta aylaning",
        "location": "Mataf, Masjid al-Haram",
        "duration": "40-60 daqiqa",
        "instructions": "Qora Tosh burchagidan boshlang. Ka‘bani chap tomoningizda qoldirib, soat miliga teskari yetti marta aylaning.",
        "dua_transliteration": "Bismillahi wa-llahu akbar",
        "dua_translation": "Alloh nomi bilan, Alloh buyukdir."
      },
      "uz_cyr": {
        "name": "Тавоф",
        "description": "Каъба атрофида етти марта айланинг",
        "location": "Матаф, Масжид ал-Ҳарам",
        "duration": "40-60 дақиқа",
        "instructions": "Қора Тош бурчагидан бошланг. Каъбани чап томонингизда қолдириб, соат милига тескари етти марта айланинг.",
        "dua_transliteration": "Bismillahi wa-llahu akbar",
        "dua_translation": "Аллоҳ номи билан, Аллоҳ буюкдир."
      },
      "ru": {
        "name": "Таваф",
        "description": "Семь обходов вокруг Каабы",
        "location": "Матаф, Масджид аль-Харам",
        "duration": "40-60 мин",
        "instructions": "Начните у угла Чёрного камня. Держите Каабу слева и обойдите её семь раз против часовой стрелки.",
        "dua_transliteration": "Bismillahi wa-llahu akbar",
        "dua_translation": "С именем Аллаха, Аллах велик."
      }
    }
  },
  {
    "sort_order": 3,
    "arabic": "ركعتا الطواف",
    "dua_arabic": "وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى",
    "translations": {
      "en": {
        "name": "Two rakahs",
        "description": "Pray at Maqam Ibrahim",
        "location": "Behind Maqam Ibrahim",
        "duration": "5–10 min",
        "instructions": "After Tawaf, offer two short rakahs behind the Station of Ibrahim if space allows, otherwise anywhere in the mosque. Recite Surah al-Kafirun and al-Ikhlas.",
        "dua_transliteration": "Wattakhidhū min maqāmi Ibrāhīma muṣallā",
        "dua_translation": "And take the Station of Ibrahim as a place of prayer."
      },
      "uz_latin": {
        "name": "Ikki rakat",
        "description": "Maqomi Ibrohim yonida namoz o‘qing",
        "location": "Maqomi Ibrohim ortida",
        "duration": "5-10 daqiqa",
        "instructions": "Tavofdan keyin imkon bo‘lsa Maqomi Ibrohim ortida ikki rakat namoz o‘qing, bo‘lmasa masjidning istalgan joyida o‘qing.",
        "dua_transliteration": "Wattakhidhu min maqami Ibrahima musalla",
        "dua_translation": "Maqomi Ibrohimni namoz joyi qiling."
      },
      "uz_cyr": {
        "name": "Икки ракат",
        "description": "Мақоми Иброҳим ёнида намоз ўқинг",
        "location": "Мақоми Иброҳим ортида",
        "duration": "5-10 дақиқа",
        "instructions": "Тавофдан кейин имкон бўлса Мақоми Иброҳим ортида икки ракат намоз ўқинг.",
        "dua_transliteration": "Wattakhidhu min maqami Ibrahima musalla",
        "dua_translation": "Мақоми Иброҳимни намоз жойи қилинг."
      },
      "ru": {
        "name": "Два ракаата",
        "description": "Совершите молитву у Макама Ибрахима",
        "location": "За Макамом Ибрахима",
        "duration": "5-10 мин",
        "instructions": "После Тавафа совершите два коротких ракаата за Макамом Ибрахима, если есть место.",
        "dua_transliteration": "Wattakhidhu min maqami Ibrahima musalla",
        "dua_translation": "Сделайте Макам Ибрахима местом молитвы."
      }
    }
  },
  {
    "sort_order": 4,
    "arabic": "ماء زمزم",
    "dua_arabic": "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا",
    "translations": {
      "en": {
        "name": "Zamzam",
        "description": "Drink from the sacred well",
        "location": "Zamzam dispensers",
        "duration": "5 min",
        "instructions": "Drink your fill of Zamzam water facing the Qiblah, in three breaths, and make sincere du'a — it is answered for whatever purpose it is drunk.",
        "dua_transliteration": "Allāhumma innī as'aluka ʿilman nāfiʿan wa rizqan wāsiʿā",
        "dua_translation": "O Allah, I ask You for beneficial knowledge and abundant provision."
      },
      "uz_latin": {
        "name": "Zamzam",
        "description": "Muqaddas quduq suvidan iching",
        "location": "Zamzam dispenserlari",
        "duration": "5 daqiqa",
        "instructions": "Qiblaga yuzlanib, uch nafasda Zamzam iching va samimiy duo qiling.",
        "dua_transliteration": "Allahumma inni as'aluka ilman nafian wa rizqan wasian",
        "dua_translation": "Allohim, Sendan foydali ilm va keng rizq so‘rayman."
      },
      "uz_cyr": {
        "name": "Замзам",
        "description": "Муқаддас қудуқ сувидан ичинг",
        "location": "Замзам диспенсерлари",
        "duration": "5 дақиқа",
        "instructions": "Қиблага юзланиб, уч нафасда Замзам ичинг ва самимий дуо қилинг.",
        "dua_transliteration": "Allahumma inni as'aluka ilman nafian wa rizqan wasian",
        "dua_translation": "Аллоҳим, Сендан фойдали илм ва кенг ризқ сўрайман."
      },
      "ru": {
        "name": "Замзам",
        "description": "Выпейте воду из священного колодца",
        "location": "Диспенсеры Замзама",
        "duration": "5 мин",
        "instructions": "Пейте Замзам, повернувшись к Кибле, в три глотка, и сделайте искреннее дуа.",
        "dua_transliteration": "Allahumma inni as'aluka ilman nafian wa rizqan wasian",
        "dua_translation": "О Аллах, прошу у Тебя полезного знания и широкого удела."
      }
    }
  },
  {
    "sort_order": 5,
    "arabic": "السعي",
    "dua_arabic": "إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّه",
    "translations": {
      "en": {
        "name": "Sa'i",
        "description": "Walk between Safa and Marwah",
        "location": "Mas'a gallery",
        "duration": "30–45 min",
        "instructions": "Begin at Safa facing the Kaaba and make du'a, then walk to Marwah — seven trips in all. Men jog between the green markers. End at Marwah.",
        "dua_transliteration": "Inna-ṣ-ṣafā wal-marwata min shaʿā'iri-llāh",
        "dua_translation": "Indeed, Safa and Marwah are among the symbols of Allah."
      },
      "uz_latin": {
        "name": "Sa‘y",
        "description": "Safo va Marva orasida yuring",
        "location": "Mas‘a yo‘lagi",
        "duration": "30-45 daqiqa",
        "instructions": "Safoda Ka‘baga yuzlanib duo qiling, so‘ng Marvaga boring. Jami yetti qatnov bo‘ladi.",
        "dua_transliteration": "Inna-s-safa wal-marwata min sha'airi-llah",
        "dua_translation": "Albatta Safo va Marva Allohning belgilaridandir."
      },
      "uz_cyr": {
        "name": "Саъй",
        "description": "Сафо ва Марва орасида юринг",
        "location": "Масъа йўлаги",
        "duration": "30-45 дақиқа",
        "instructions": "Сафода Каъбага юзланиб дуо қилинг, сўнг Марвага боринг. Жами етти қатнов бўлади.",
        "dua_transliteration": "Inna-s-safa wal-marwata min sha'airi-llah",
        "dua_translation": "Албатта Сафо ва Марва Аллоҳнинг белгиларидандир."
      },
      "ru": {
        "name": "Сай",
        "description": "Пройдите между Сафа и Марва",
        "location": "Галерея Масъа",
        "duration": "30-45 мин",
        "instructions": "Начните на Сафа, повернитесь к Каабе и сделайте дуа, затем идите к Марва. Всего семь проходов.",
        "dua_transliteration": "Inna-s-safa wal-marwata min sha'airi-llah",
        "dua_translation": "Воистину, Сафа и Марва из знамений Аллаха."
      }
    }
  },
  {
    "sort_order": 6,
    "arabic": "الحلق والتقصير",
    "dua_arabic": "اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ",
    "translations": {
      "en": {
        "name": "Halq / Taqsir",
        "description": "Shave or trim the hair",
        "location": "Near Marwah",
        "duration": "10 min",
        "instructions": "Men shave the head completely (halq) or trim evenly (taqsir); shaving is more rewarding. Women cut a fingertip's length from their hair. This releases you from ihram.",
        "dua_transliteration": "Allāhumma-ghfir lil-muḥalliqīn",
        "dua_translation": "O Allah, forgive those who shave their heads."
      },
      "uz_latin": {
        "name": "Halq / Taqsir",
        "description": "Sochni oldiring yoki qisqartiring",
        "location": "Marva yaqinida",
        "duration": "10 daqiqa",
        "instructions": "Erkaklar sochini to‘liq oldiradi yoki teng qisqartiradi; ayollar sochidan barmoq uchi miqdorida kesadi.",
        "dua_transliteration": "Allahumma-ghfir lil-muhalliqin",
        "dua_translation": "Allohim, sochini oldirganlarni mag‘firat qil."
      },
      "uz_cyr": {
        "name": "Ҳалқ / Тақсир",
        "description": "Сочни олдиринг ёки қисқартиринг",
        "location": "Марва яқинида",
        "duration": "10 дақиқа",
        "instructions": "Эркаклар сочини тўлиқ олдиради ёки тенг қисқартиради; аёллар сочидан бармоқ учи миқдорида кесади.",
        "dua_transliteration": "Allahumma-ghfir lil-muhalliqin",
        "dua_translation": "Аллоҳим, сочини олдирганларни мағфират қил."
      },
      "ru": {
        "name": "Хальк / Таксир",
        "description": "Сбрейте или подстригите волосы",
        "location": "Рядом с Марва",
        "duration": "10 мин",
        "instructions": "Мужчины бреют голову полностью или ровно подстригают волосы; женщины отрезают длину кончика пальца.",
        "dua_transliteration": "Allahumma-ghfir lil-muhalliqin",
        "dua_translation": "О Аллах, прости тех, кто сбрил волосы."
      }
    }
  },
  {
    "sort_order": 7,
    "arabic": "إتمام العمرة",
    "dua_arabic": "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَات",
    "translations": {
      "en": {
        "name": "Completion",
        "description": "Exit ihram and conclude",
        "location": "Masjid al-Haram",
        "duration": "—",
        "instructions": "Your Umrah is complete and the restrictions of ihram are lifted. Thank Allah for the blessing, and spend your remaining time in prayer and du'a at the Haram.",
        "dua_transliteration": "Al-ḥamdu lillāhi-lladhī bi-niʿmatihi tatimmu-ṣ-ṣāliḥāt",
        "dua_translation": "Praise be to Allah by whose grace good deeds are completed."
      },
      "uz_latin": {
        "name": "Yakunlash",
        "description": "Ihramdan chiqing va ziyoratni yakunlang",
        "location": "Masjid al-Haram",
        "duration": "-",
        "instructions": "Umrangiz tugadi va ihram cheklovlari ko‘tarildi. Ne‘mat uchun Allohga shukr qiling.",
        "dua_transliteration": "Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat",
        "dua_translation": "Yaxshi ishlar Uning ne‘mati bilan tugaydigan Allohga hamd bo‘lsin."
      },
      "uz_cyr": {
        "name": "Якунлаш",
        "description": "Иҳромдан чиқинг ва зиёратни якунланг",
        "location": "Масжид ал-Ҳарам",
        "duration": "-",
        "instructions": "Умрангиз тугади ва иҳром чекловлари кўтарилди. Неъмат учун Аллоҳга шукр қилинг.",
        "dua_transliteration": "Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat",
        "dua_translation": "Яхши ишлар Унинг неъмати билан тугайдиган Аллоҳга ҳамд бўлсин."
      },
      "ru": {
        "name": "Завершение",
        "description": "Выйдите из ихрама и завершите обряд",
        "location": "Масджид аль-Харам",
        "duration": "-",
        "instructions": "Ваша Умра завершена, и ограничения ихрама сняты. Поблагодарите Аллаха за милость.",
        "dua_transliteration": "Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat",
        "dua_translation": "Хвала Аллаху, по милости Которого завершаются благие дела."
      }
    }
  }
];

/** Du'as per step (key = step sort_order), not tied to a circuit. */
const STEP_DUAS: Record<string, Dua[]> = {
  "0": [
    {
      "dua_arabic": "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
      "translations": {
        "en": {
          "title": "On entering the mosque",
          "transliteration": "Allāhumma-ftaḥ lī abwāba raḥmatik.",
          "translation": "O Allah, open for me the gates of Your mercy.",
          "reference": null
        },
        "uz_latin": {
          "title": "Masjidga kirishda",
          "transliteration": "Allahumma-ftah li abwaba rahmatik",
          "translation": "Allohim, rahmating eshiklarini menga och.",
          "reference": null
        },
        "uz_cyr": {
          "title": "Масжидга киришда",
          "transliteration": "Allahumma-ftah li abwaba rahmatik",
          "translation": "Аллоҳим, раҳматинг эшикларини менга оч.",
          "reference": null
        },
        "ru": {
          "title": "При входе в мечеть",
          "transliteration": "Allahumma-ftah li abwaba rahmatik",
          "translation": "О Аллах, открой мне врата Твоей милости.",
          "reference": null
        }
      }
    }
  ],
  "1": [
    {
      "dua_arabic": "لَبَّيْكَ اللَّهُمَّ لَبَّيْك",
      "translations": {
        "en": {
          "title": "Talbiyah",
          "transliteration": "Labbayka-llāhumma labbayk.",
          "translation": "Here I am, O Allah, here I am.",
          "reference": null
        },
        "uz_latin": {
          "title": "Talbiya",
          "transliteration": "Labbayka-llahumma labbayk",
          "translation": "Labbayk, ey Alloh, labbayk.",
          "reference": null
        },
        "uz_cyr": {
          "title": "Талбия",
          "transliteration": "Labbayka-llahumma labbayk",
          "translation": "Лаббайк, эй Аллоҳ, лаббайк.",
          "reference": null
        },
        "ru": {
          "title": "Тальбия",
          "transliteration": "Labbayka-llahumma labbayk",
          "translation": "Вот я перед Тобой, о Аллах.",
          "reference": null
        }
      }
    }
  ],
  "2": [
    {
      "dua_arabic": "بسم الله الله أكبر ولله الحمد والصلوة والسلام على رسول الله اللهم إيماناً بك وتصديقاً بكتابك، ووفاء بعهدك، واتباعاً لسنة نبيك محمد صلّى الله عليه وسلم.",
      "translations": {
        "en": {
          "title": "On beginning the Tawaf",
          "transliteration": "Bismillāhi Allāhu akbar wa lillāhi-l-ḥamd, waṣ-ṣalātu was-salāmu ʿalā Rasūlillāh. Allāhumma īmānan bika wa taṣdīqan bi-kitābika wa wafāʾan bi-ʿahdika wa-ttibāʿan li-sunnati nabiyyika Muḥammadin ṣalla-llāhu ʿalayhi wa sallam.",
          "translation": "In the name of Allah I begin the Tawaf. Allah is the Greatest. Praise be to Allah. Blessings and peace be upon His Messenger. O Allah, (I begin the Tawaf) believing in You, affirming Your Book, fulfilling Your covenant and following the Sunnah of Your Prophet.",
          "reference": "Fatawa Qadikhan"
        },
        "uz_latin": {
          "title": "Tavofga kirishda",
          "transliteration": "Bismillaahi, Allohu akbar va lillaahil hamd, vas-solaatu vas-salaamu ’alaa rasulillaah. Allohumma, iymaanan bika va tasdiyqon bi kitaabika va vafaai bi’ahdika vattibaa’an lisunnati nabiyyika Muhammadin sollallohu alayhi vasallam",
          "translation": "Alloh nomi ila tavof qilishni boshlayman. Alloh ulug‘dir. Allohga hamdu sanolar bo‘lsin. U Zotning Rasuliga salavotu salomlar bo‘lsin. Allohim! Senga iymon keltirib, kitobingni tasdiq qilib, ahdingga vafo qilib, Nabiyingning sunnatiga ergashib (tavofni boshlayman).",
          "reference": "Qoziyxon"
        },
        "uz_cyr": {
          "title": "Тавофга киришишда",
          "transliteration": "Бисмиллааҳи, Аллоҳу акбар ва лиллааҳил ҳамд, вас-солаату вас-салааму ъалаа расулиллааҳ. Аллоҳумма, иймаанан бика ва тасдийқон би китаабика ва вафааи биъаҳдика ваттибааъан лисуннати набиййика Муҳаммадин соллаллоҳу алайҳи васаллам",
          "translation": "Аллоҳ номи ила тавоф қилишни бошлайман. Аллоҳ улуғдир. Аллоҳга ҳамду санолар бўлсин. У Зотнинг Расулига салавоту саломлар бўлсин. Аллоҳим! Сенга иймон келтириб, китобингни тасдиқ қилиб, аҳдингга вафо қилиб, Набийингнинг суннатига эргашиб (тавофни бошлайман).",
          "reference": "Қозийхон"
        },
        "ru": {
          "title": "При начале тавафа",
          "transliteration": "Бисмиллаахи, Аллоху акбар ва лиллаахил хамд, вас-солаату вас-салааму ъалаа расулиллаах. Аллохумма, иймаанан бика ва тасдийкон би китаабика ва вафааи биъахдика ваттибааъан лисуннати набиййика Мухаммадин соллаллоху алайхи васаллам",
          "translation": "С именем Аллаха начинаю таваф. Аллах велик. Хвала Аллаху. Благословение и мир Его Посланнику. О Аллах, (начинаю таваф) веруя в Тебя, признавая истинность Твоей Книги, исполняя завет с Тобой и следуя Сунне Твоего Пророка.",
          "reference": "Фатава Казыхан"
        }
      }
    },
    {
      "dua_arabic": "بِسْمِ اللَّهِ اَللَّهُ أَكْبَرُ وَللَّه الْحَمد",
      "translations": {
        "en": {
          "title": "Short form — also at the start of each circuit",
          "transliteration": "Bismillāhi Allāhu akbar wa lillāhi-l-ḥamd.",
          "translation": "In the name of Allah. Allah is the Greatest, and praise be to Allah.",
          "reference": null
        },
        "uz_latin": {
          "title": "Qisqa varianti — har aylanish boshida ham",
          "transliteration": "Bismillaahi, Allohu akbar, va lillaahil hamd",
          "translation": "Alloh nomi bilan. Alloh ulug‘dir, Allohga hamd bo‘lsin.",
          "reference": null
        },
        "uz_cyr": {
          "title": "Қисқа варианти — ҳар айланиш бошида ҳам",
          "transliteration": "Бисмиллааҳи, Аллоҳу акбар, ва лиллааҳил ҳамд",
          "translation": "Аллоҳ номи билан. Аллоҳ улуғдир, Аллоҳга ҳамд бўлсин.",
          "reference": null
        },
        "ru": {
          "title": "Краткий вариант — также в начале каждого круга",
          "transliteration": "Бисмиллаахи, Аллоху акбар, ва лиллаахил хамд",
          "translation": "С именем Аллаха. Аллах велик, и хвала Аллаху.",
          "reference": null
        }
      }
    }
  ],
  "3": [
    {
      "dua_arabic": "وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى.",
      "translations": {
        "en": {
          "title": "At Maqam Ibrahim, before the two rak‘ahs",
          "transliteration": "Wattakhidhū min maqāmi Ibrāhīma muṣallā.",
          "translation": "Take the Station of Ibrahim as a place of prayer.",
          "reference": "Surah al-Baqarah, 2:125"
        },
        "uz_latin": {
          "title": "Maqomi Ibrohimda, namozdan oldin",
          "transliteration": "Vattaxizu min maqomi Ibrohima musolla",
          "translation": "Ibrohimning maqomini namozgoh tuting",
          "reference": "Baqara surasi, 125-oyat"
        },
        "uz_cyr": {
          "title": "Мақоми Иброҳимда, намоздан олдин",
          "transliteration": "Ваттахизу мин мақоми Иброҳима мусолла",
          "translation": "Иброҳимнинг мақомини намозгоҳ тутинг",
          "reference": "Бақара сураси, 125-оят"
        },
        "ru": {
          "title": "У Макама Ибрахима, перед двумя ракаатами",
          "transliteration": "Ваттахизу мин макоми Иброхима мусолла",
          "translation": "Сделайте место стояния Ибрахима местом молитвы.",
          "reference": "Сура аль-Бакара, 2:125"
        }
      }
    },
    {
      "dua_arabic": "اللَّهُمَّ إِنَّكَ تَعْلَمُ سِرِّي وَعَلانِيَتِي فَاقْبَلْ مَعْذِرَتِي ، وَتَعْلَمُ حَاجَتِي فَأَعْطِنِي سُؤْلِي ، وَتَعْلَمُ مَا فِي نَفْسِي فَاغْفِرْ لِي ذُنُوبِي ، اللَّهُمَّ إِنِّي أَسْأَلُكَ إِيمَانًا يُبَاشِرُ قَلْبِي ، وَيَقِينًا صَادِقًا حَتَّى أَعْلَمَ أَنَّهُ لا يُصِيبُنِي إِلاَّ مَا كَتَبْتَ لي وَرِضَاءً بِمَا قَسَّمْتَ لِي يا أرحم الراحمين.",
      "translations": {
        "en": {
          "title": "After the two rak‘ahs — the du‘a of Adam (peace be upon him)",
          "transliteration": "Allāhumma innaka taʿlamu sirrī wa ʿalāniyatī faqbal maʿdhiratī, wa taʿlamu ḥājatī faʾaʿṭinī suʾlī, wa taʿlamu mā fī nafsī faghfir lī dhunūbī. Allāhumma innī asʾaluka īmānan yubāshiru qalbī, wa yaqīnan ṣādiqan ḥattā aʿlama annahu lā yuṣībunī illā mā katabta lī, wa riḍan bimā qassamta lī, yā arḥama-r-rāḥimīn.",
          "translation": "O Allah, You know well what I hide and what I show, so accept my excuse. You know my need, so grant what I ask. You know what is in my soul, so forgive my sins. O Allah, I ask You for faith that fills my heart and true certainty, so that I know nothing reaches me except what You have written for me, and contentment with what You have allotted me, O Most Merciful of the merciful!",
          "reference": "Tabyin al-Haqaiq"
        },
        "uz_latin": {
          "title": "Ikki rakatdan keyin — Odam alayhissalom duosi",
          "transliteration": "Allohumma! Innaka ta’lamu sirriy va ’alaaniyatiy faqbal ma’zirotiy va ta’lamu haajatiy va a’tiniy su’liy, va ta’lamu maa fiy nafsiy fag‘fir liy zunuubiy. Allohumma! As’aluka iymaanan yubaashiru qolbiy va yaqiynan sodiqon hatta a’lama annahu laa yusiybuniy illa maa katabta liy va ridoan bimaa qossamta liy, yaa arhamar rohimiyn",
          "translation": "Allohim! Sen mening zohirimu botinimni juda yaxshi bilasan. Uzrimni qabul qilgin. Hojatimni ham bilasan, so‘raganimni bergin. Dilimdagini ham bilasan, gunohlarimni mag‘firat qilgin. Allohim! Men sendan qalbimga qorishib ketgan iymon, haqiqiy ishonch so‘rayman. Taqdirimga Sen bitgan narsadan o‘zga biror narsa menga yetmasligini bilaman. Men uchun taqsim qilgan narsangga roziman, ey mehribonlar mehriboni!",
          "reference": "Tabyiynul haqoiq"
        },
        "uz_cyr": {
          "title": "Икки ракатдан кейин — Одам алайҳиссалом дуоси",
          "transliteration": "Аллоҳумма! Иннака таъламу сиррий ва ъалааниятий фақбал маъзиротий ва таъламу ҳаажатий ва аътиний суълий, ва таъламу маа фий нафсий фағфир лий зунуубий. Аллоҳумма! Асъалука иймаанан йубааширу қолбий ва яқийнан содиқон ҳатта аълама аннаҳу лаа йусийбуний илла маа катабта лий ва ридоан бимаа қоссамта лий, йаа арҳамар роҳимийн",
          "translation": "Аллоҳим! Сен менинг зоҳириму ботинимни жуда яхши биласан. Узримни қабул қилгин. Ҳожатимни ҳам биласан, сўраганимни бергин. Дилимдагини ҳам биласан, гуноҳларимни мағфират қилгин. Аллоҳим! Мен сендан қалбимга қоришиб кетган иймон, ҳақиқий ишонч сўрайман. Тақдиримга Сен битган нарсадан ўзга бирор нарса менга етмаслигини биламан. Мен учун тақсим қилган нарсангга розиман, эй меҳрибонлар меҳрибони!",
          "reference": "Табйийнул ҳақоиқ"
        },
        "ru": {
          "title": "После двух ракаатов — дуа Адама (мир ему)",
          "transliteration": "Аллохумма! Иннака таъламу сиррий ва ъалааниятий факбал маъзиротий ва таъламу хаажатий ва аътиний суълий, ва таъламу маа фий нафсий фагфир лий зунуубий. Аллохумма! Асъалука иймаанан йубааширу колбий ва якийнан содикон хатта аълама аннаху лаа йусийбуний илла маа катабта лий ва ридоан бимаа коссамта лий, йаа архамар рохимийн",
          "translation": "О Аллах, Ты хорошо знаешь моё тайное и явное — прими же моё оправдание. Ты знаешь мою нужду — дай же мне то, о чём прошу. Ты знаешь то, что в моей душе, — прости же мои грехи. О Аллах, прошу у Тебя веры, наполняющей моё сердце, и истинной убеждённости, чтобы я знал, что меня постигнет лишь то, что Ты предписал мне, и довольства тем, что Ты мне уделил, о Милосерднейший из милосердных!",
          "reference": "Табйин аль-Хакаик"
        }
      }
    },
    {
      "dua_arabic": "اللَّهُمَّ إنَّ هَذَا بَيْتُك الَّذِي جَعَلْته مُبَارَكًا وَهُدَى لِلْعَالَمِينَ اللَّهُمَّ كَمَا هَدَيْتنِي لَهُ فَتَقَبَّلْ مِنِّي ، وَلَا تَجْعَلْ هَذَا آخِرَ الْعَهْدِ مِنْ بَيْتِك وَارْزُقْنِي الْعَوْدَ إلَيْهِ حَتَّى تَرْضَى عَنِّي بِرَحْمَتِك يَا أَرْحَمَ الرَّاحِمِينَ.",
      "translations": {
        "en": {
          "title": "At the Multazam",
          "transliteration": "Allāhumma inna hādhā baytuka-lladhī jaʿaltahu mubārakan wa hudan lil-ʿālamīn. Allāhumma kamā hadaytanī lahu fataqabbal minnī, wa lā tajʿal hādhā ākhira-l-ʿahdi min baytik, warzuqni-l-ʿawda ilayhi ḥattā tarḍā ʿannī, bi-raḥmatika yā arḥama-r-rāḥimīn.",
          "translation": "O Allah, this is the House that You made blessed and a guidance for the worlds. O Allah, as You guided me to visit this House, accept my visit from me. Do not make this journey to Your House my last; by Your mercy grant me to return to it again and again until You are pleased with me, O Most Merciful of the merciful!",
          "reference": "Maraqi al-Falah"
        },
        "uz_latin": {
          "title": "Multazamda",
          "transliteration": "Allohumma! Inna haaza Baytukaallaziy ja’altahu mubaarokan va hudan lil’aalamiyn. Allohumma! Kamaa hadaytaniy lahu fataqobbal minniy va laa taj’al haaza aaxirol ahdi min Baytika, varzuqniy al-avda ilayhi hatta tardo ’anniy, birohmatika yaa arhamar rohimiyn",
          "translation": "Allohim, bu Bayt Sen muborak qilgan va olamlarga hidoyat qilgan Baytdir. Allohim! Meni bu Baytni ziyorat qilishga hidoyat qilganingdek ziyoratimni mendan qabul ayla. Baytingga qilgan bu safarimni oxirgi safarim qilma. O‘zing mendan rozi bo‘lguningcha qayta-qayta kelishni rahmating ila nasib qilgin, ey mehribonlar mehriboni!",
          "reference": "Maroqil faloh"
        },
        "uz_cyr": {
          "title": "Мултазамда",
          "transliteration": "Аллоҳумма! Инна ҳааза Байтукааллазий жаъалтаҳу мубаарокан ва ҳудан лилъааламийн. Аллоҳумма! Камаа ҳадайтаний лаҳу фатақоббал минний ва лаа тажъал ҳааза аахирол аҳди мин Байтика, варзуқний ал-авда илайҳи ҳатта тардо ъанний, бироҳматика йаа арҳамар роҳимийн",
          "translation": "Аллоҳим, бу Байт Сен муборак қилган ва оламларга ҳидоят қилган Байтдир. Аллоҳим! Мени бу Байтни зиёрат қилишга ҳидоят қилганингдек зиёратимни мендан қабул айла. Байтингга қилган бу сафаримни охирги сафарим қилма. Ўзинг мендан рози бўлгунингча қайта-қайта келишни раҳматинг ила насиб қилгин, эй меҳрибонлар меҳрибони!",
          "reference": "Мароқил фалоҳ"
        },
        "ru": {
          "title": "У Мультазама",
          "transliteration": "Аллохумма! Инна хааза Байтукааллазий жаъалтаху мубаарокан ва худан лилъааламийн. Аллохумма! Камаа хадайтаний лаху фатакоббал минний ва лаа тажъал хааза аахирол ахди мин Байтика, варзукний ал-авда илайхи хатта тардо ъанний, бирохматика йаа архамар рохимийн",
          "translation": "О Аллах, это Дом, который Ты сделал благословенным и руководством для миров. О Аллах, как Ты привёл меня к посещению этого Дома, так прими от меня моё посещение. Не делай это путешествие к Твоему Дому последним, по Твоей милости даруй мне возвращаться к нему снова и снова, пока Ты не будешь доволен мной, о Милосерднейший из милосердных!",
          "reference": "Мараки аль-Фалях"
        }
      }
    },
    {
      "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك إيمَانًا لَا يَزُولُ وَيَقِينًا لَا يَنْفَدُ وَمُرَافَقَةَ نَبِيِّك مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ اللَّهُمَّ أَظلَّنِي تَحْتَ ظِلِّ عَرْشِك يَوْمَ لَا ظِلَّ إلَّا ظِلُّ عَرْشِك وَاسْقِنِي بِكَأْسِ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ شرْبَةً لَا أَظْمَأُ بَعْدَهَا أَبَدًا.",
      "translations": {
        "en": {
          "title": "Under the Rain Spout of Mercy (Mizab)",
          "transliteration": "Allāhumma innī asʾaluka īmānan lā yazūlu, wa yaqīnan lā yanfadu, wa murāfaqata nabiyyika Muḥammadin ṣalla-llāhu ʿalayhi wa sallam. Allāhumma aẓillanī taḥta ẓilli ʿarshika yawma lā ẓilla illā ẓillu ʿarshik, wasqinī bi-kaʾsi Muḥammadin ṣalla-llāhu ʿalayhi wa sallam sharbatan lā aẓmaʾu baʿdahā abadā.",
          "translation": "O Allah, I ask You for faith that does not fade, certainty that does not run out, and companionship with Your Prophet Muhammad ﷺ. O Allah, shade me under the shade of Your Throne on the Day when there is no shade but the shade of Your Throne, and let me drink from the cup of Muhammad ﷺ a drink after which I will never thirst again.",
          "reference": "Tabyin al-Haqaiq"
        },
        "uz_latin": {
          "title": "Rahmat tarnovi ostida",
          "transliteration": "Allohumma! Inniy as’aluka iymaanan laa yazuulu va yaqiynan laa yanfadu va murofaqata Nabiyyika Muhammadin sollallohu alayhi vasallama! Allohumma! Azollaniy tahta zilli ’arshika yavma laa zilla illaa zillu arshika, vasqiniy bika’si Muhammadin sollallohu alayhi vasallam sharbatan laa azmau ba’dahaa abadan",
          "translation": "Allohim! Sendan ajralmas iymon, tugab-bitmas ishonch, Nabiyying Muhammad sollallohu alayhi vasallam bilan birga bo‘lishni so‘rayman. Allohim! Arshing soyasidan o‘zga soya yo‘q kunda meni uning soyasi ostida soyalantirgin. Muhammad sollallohu alayhi vasallamning piyolalarida qaytib hech qachon chanqamaydigan qilib suv ichirgin",
          "reference": "Tabyiynul haqoiq"
        },
        "uz_cyr": {
          "title": "Раҳмат тарнови остида",
          "transliteration": "Аллоҳумма! Инний асъалука иймаанан лаа йазуулу ва яқийнан лаа янфаду ва мурофақата Набиййика Муҳаммадин соллаллоҳу алайҳи васаллама! Аллоҳумма! Азолланий таҳта зилли ъаршика йавма лаа зилла иллаа зиллу аршика, васқиний бикаъси Муҳаммадин соллаллоҳу алайҳи васаллам шарбатан лаа азмау баъдаҳаа абадан",
          "translation": "Аллоҳим! Сендан ажралмас иймон, тугаб-битмас ишонч, Набиййинг Муҳаммад соллаллоҳу алайҳи васаллам билан бирга бўлишни сўрайман. Аллоҳим! Аршинг соясидан ўзга соя йўқ кунда мени унинг сояси остида соялантиргин. Муҳаммад соллаллоҳу алайҳи васалламнинг пиёлаларида қайтиб ҳеч қачон чанқамайдиган қилиб сув ичиргин",
          "reference": "Табйийнул ҳақоиқ"
        },
        "ru": {
          "title": "Под Желобом милости",
          "transliteration": "Аллохумма! Инний асъалука иймаанан лаа йазуулу ва якийнан лаа янфаду ва мурофаката Набиййика Мухаммадин соллаллоху алайхи васаллама! Аллохумма! Азолланий тахта зилли ъаршика йавма лаа зилла иллаа зиллу аршика, васкиний бикаъси Мухаммадин соллаллоху алайхи васаллам шарбатан лаа азмау баъдахаа абадан",
          "translation": "О Аллах, прошу у Тебя неисчезающей веры, неиссякаемой убеждённости и соседства с Твоим Пророком Мухаммадом ﷺ. О Аллах, укрой меня в тени Твоего Трона в День, когда не будет тени, кроме тени Твоего Трона, и напои меня из чаши Мухаммада ﷺ так, чтобы я больше никогда не испытал жажды.",
          "reference": "Табйин аль-Хакаик"
        }
      }
    }
  ],
  "4": [
    {
      "dua_arabic": "اللَّهُمَّ اني أَسْأَلُكَ عِلْمًا نَافِعًا ، وَرِزْقًا وَاسِعًا ، وَشِفَاءً مِنْ كُلِّ دَاءٍ.",
      "translations": {
        "en": {
          "title": "While drinking Zamzam",
          "transliteration": "Allāhumma innī asʾaluka ʿilman nāfiʿā, wa rizqan wāsiʿā, wa shifāʾan min kulli dāʾ.",
          "translation": "O Allah, I ask You for beneficial knowledge, abundant provision and healing from every illness.",
          "reference": "Fatawa Qadikhan"
        },
        "uz_latin": {
          "title": "Zamzam suvini ichayotganda",
          "transliteration": "Allohumma! Inniy as’aluka ilman naafi’an, va rizqon vaasi’an, va shifaaan min kulli daain",
          "translation": "Allohim! Men Sendan foydali ilm, keng rizq va barcha darddan shifo so‘rayman",
          "reference": "Fatavoi Qozixon"
        },
        "uz_cyr": {
          "title": "Замзам сувини ичаётганда",
          "transliteration": "Аллоҳумма! Инний асъалука илман наафиъан, ва ризқон ваасиъан, ва шифааан мин кулли дааин",
          "translation": "Аллоҳим! Мен Сендан фойдали илм, кенг ризқ ва барча дарддан шифо сўрайман",
          "reference": "Фатавои Қозихон"
        },
        "ru": {
          "title": "Когда пьёте Замзам",
          "transliteration": "Аллохумма! Инний асъалука илман наафиъан, ва ризкон ваасиъан, ва шифааан мин кулли дааин",
          "translation": "О Аллах, прошу у Тебя полезного знания, широкого удела и исцеления от всякой болезни.",
          "reference": "Фатава Казыхан"
        }
      }
    }
  ],
  "5": [
    {
      "dua_arabic": "بسم الله والصلوة والسلام على رسول الله اللهمّ اغفِر لِي ذُنُوبِي وافتَح لِي أَبواب فضلك.",
      "translations": {
        "en": {
          "title": "On leaving Masjid al-Haram",
          "transliteration": "Bismillāh, waṣ-ṣalātu was-salāmu ʿalā Rasūlillāh. Allāhumma-ghfir lī dhunūbī waftaḥ lī abwāba faḍlik.",
          "translation": "In the name of Allah (I leave the mosque). Blessings and peace be upon the Messenger of Allah. O Allah, forgive my sins and open for me the gates of Your bounty and mercy.",
          "reference": "Ghunyat al-Nasik"
        },
        "uz_latin": {
          "title": "Masjidul Haromdan chiqishda",
          "transliteration": "Bismillaahi, vas-solatu vas-salaamu ’alaa Rasulillaah. Allohummag‘fir liy zunuubiy vaftah liy abvaaba fadlik",
          "translation": "Alloh nomi ila (masjiddan chiqaman). Allohning Rasuliga salavotu salomlar bo‘lsin. Allohim! Gunohlarimni mag‘firat qilib, menga fazlu rahmat darvozalaringni ochgin",
          "reference": "G‘uniyatun nosik"
        },
        "uz_cyr": {
          "title": "Масжидул Ҳаромдан чиқишда",
          "transliteration": "Бисмиллааҳи, вас-солату вас-салааму ъалаа Расулиллааҳ. Аллоҳуммағфир лий зунуубий вафтаҳ лий абвааба фадлик",
          "translation": "Аллоҳ номи ила (масжиддан чиқаман). Аллоҳнинг Расулига салавоту саломлар бўлсин. Аллоҳим! Гуноҳларимни мағфират қилиб, менга фазлу раҳмат дарвозаларингни очгин",
          "reference": "Ғуниятун носик"
        },
        "ru": {
          "title": "При выходе из Масджид аль-Харам",
          "transliteration": "Бисмиллаахи, вас-солату вас-салааму ъалаа Расулиллаах. Аллохуммагфир лий зунуубий вафтах лий абвааба фадлик",
          "translation": "С именем Аллаха (выхожу из мечети). Благословение и мир Посланнику Аллаха. О Аллах, прости мои грехи и открой мне врата Твоей щедрости и милости.",
          "reference": "Гунйат ан-Насик"
        }
      }
    },
    {
      "dua_arabic": "بسم الله أبدأ بما بدأ الله به إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ.",
      "translations": {
        "en": {
          "title": "While climbing Safa",
          "transliteration": "Bismillāh, abdaʾu bimā badaʾa-llāhu bih. Inna-ṣ-ṣafā wal-marwata min shaʿāʾiri-llāh.",
          "translation": "In the name of Allah, I begin with what Allah began with: “Safa and Marwah are among the symbols of Allah” (that is, I begin the Sa‘i from Safa).",
          "reference": "Ghunyat al-Nasik"
        },
        "uz_latin": {
          "title": "Safo tog‘iga ko‘tarilayotganda",
          "transliteration": "Bismillaahi, abdau bimaa bada’allohu bihi. Innas-Sofaa val-Marvata min sha’aairillaah",
          "translation": "Allohning nomi ila Alloh «Safo va Marva – Allohning shiorlaridandir» deb boshlagan narsadan (ya’ni, Safo tog‘idan sa’y qilishni) boshlayman.",
          "reference": "G‘uniyatun nosik"
        },
        "uz_cyr": {
          "title": "Сафо тоғига кўтарилаётганда",
          "transliteration": "Бисмиллааҳи, абдау бимаа бадаъаллоҳу биҳи. Иннас-Софаа вал-Марвата мин шаъааириллааҳ",
          "translation": "Аллоҳнинг номи ила Аллоҳ «Сафо ва Марва – Аллоҳнинг шиорларидандир» деб бошлаган нарсадан (яъни, Сафо тоғидан саъй қилишни) бошлайман.",
          "reference": "Ғуниятун носик"
        },
        "ru": {
          "title": "При подъёме на Сафа",
          "transliteration": "Бисмиллаахи, абдау бимаа бадаъаллоху бихи. Иннас-Софаа вал-Марвата мин шаъааириллаах",
          "translation": "С именем Аллаха начинаю с того, с чего начал Аллах: «Сафа и Марва — из обрядовых знамений Аллаха» (то есть начинаю сай с Сафы).",
          "reference": "Гунйат ан-Насик"
        }
      }
    },
    {
      "dua_arabic": "لاَ إِلَهَ إِلاَّ اللهُ ، وَحْدَهُ لاَ شَرِيكَ لَهُ ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يحي ويميت، وَهُوَ عَلَى كَلِّ شَيْءٍ قَدِيرٌ ، لاَ إِلَهَ إِلاَّ اللهُ وَحْدَهُ ، أَنْجَزَ وَعْدَهُ ، وَنَصَرَ عَبْدَهُ ، وَهَزَمَ الأَحْزَابَ وَحْدَهُ.",
      "translations": {
        "en": {
          "title": "On Safa (three times), and again on Marwah",
          "transliteration": "Lā ilāha illa-llāhu waḥdahu lā sharīka lah, lahu-l-mulku wa lahu-l-ḥamd, yuḥyī wa yumīt, wa huwa ʿalā kulli shayʾin qadīr. Lā ilāha illa-llāhu waḥdah, anjaza waʿdah, wa naṣara ʿabdah, wa hazama-l-aḥzāba waḥdah.",
          "translation": "There is no god but Allah alone; He has no partner. To Him belong the dominion and all praise. He gives life and causes death, and He has power over all things. There is no god but Allah alone. He fulfilled His promise, helped His servant and alone defeated the enemy.",
          "reference": null
        },
        "uz_latin": {
          "title": "Safoda (uch marta) va Marvada",
          "transliteration": "Laa ilaaha illallohu vahdahu, laa shariyka lah. Lahul mulku va lahul hamdu, yuhyii va yumiytu, va huva ’alaa kulli shay’in qodiyr. Laa ilaaha illallohu vahdah. Anjaza va’dahu, va nasoro ’abdahu, va hazamal ahzaaba vahdah",
          "translation": "Yagona Allohdan o‘zga iloh yo‘q, Uning sherigi yo‘q. Mulk va maqtovlar Ungadir. Tiriltiradi, o‘ldiradi. Va U barcha narsaga qodirdir. Yagona Allohdan o‘zga iloh yo‘q. Va’dasiga vafo qildi. Bandasiga nusrat berdi. Dushmanni yolg‘iz O‘zi mag‘lub qildi",
          "reference": null
        },
        "uz_cyr": {
          "title": "Сафода (уч марта) ва Марвада",
          "transliteration": "Лаа илааҳа иллаллоҳу ваҳдаҳу, лаа шарийка лаҳ. Лаҳул мулку ва лаҳул ҳамду, йуҳйии ва йумийту, ва ҳува ъалаа кулли шайъин қодийр. Лаа илааҳа иллаллоҳу ваҳдаҳ. Анжаза ваъдаҳу, ва насоро ъабдаҳу, ва ҳазамал аҳзааба ваҳдаҳ",
          "translation": "Ягона Аллоҳдан ўзга илоҳ йўқ, Унинг шериги йўқ. Мулк ва мақтовлар Унгадир. Тирилтиради, ўлдиради. Ва У барча нарсага қодирдир. Ягона Аллоҳдан ўзга илоҳ йўқ. Ваъдасига вафо қилди. Бандасига нусрат берди. Душманни ёлғиз Ўзи мағлуб қилди",
          "reference": null
        },
        "ru": {
          "title": "На Сафе (трижды) и на Марве",
          "transliteration": "Лаа илааха иллаллоху вахдаху, лаа шарийка лах. Лахул мулку ва лахул хамду, йухйии ва йумийту, ва хува ъалаа кулли шайъин кодийр. Лаа илааха иллаллоху вахдах. Анжаза ваъдаху, ва насоро ъабдаху, ва хазамал ахзааба вахдах",
          "translation": "Нет божества, кроме одного Аллаха, у Него нет сотоварища. Ему принадлежат власть и хвала. Он оживляет и умерщвляет, и Он властен над всякой вещью. Нет божества, кроме одного Аллаха. Он исполнил Своё обещание, помог Своему рабу и один разбил врагов.",
          "reference": null
        }
      }
    },
    {
      "dua_arabic": "رَبِّ اغْفِرْ وَارْحَمْ وتجاوز عما تعلم إِنَّكَ أَنْتَ الأعَزُّ الأكْرَمُ.",
      "translations": {
        "en": {
          "title": "Between the two green markers",
          "transliteration": "Rabbi-ghfir warḥam, wa tajāwaz ʿammā taʿlam, innaka anta-l-aʿazzu-l-akram.",
          "translation": "My Lord, forgive me and have mercy on me, and pass over the sins You know of me. You are the Mighty, the Most Generous.",
          "reference": "Fatawa Qadikhan"
        },
        "uz_latin": {
          "title": "Ikki yashil chiziq orasida",
          "transliteration": "Robbig‘fir, varham. Va tajaavaz ’ammaa ta’lam. Innaka antal a’azzul akrom",
          "translation": "Robbim! Meni mag‘firat qil va rahm qil. O‘zing bilgan gunohlarni mendan kechgin. Sen g‘olibsan, karam sohibisan",
          "reference": "Fatavoi qozixon"
        },
        "uz_cyr": {
          "title": "Икки яшил чизиқ орасида",
          "transliteration": "Роббиғфир, варҳам. Ва тажааваз ъаммаа таълам. Иннака антал аъаззул акром",
          "translation": "Роббим! Мени мағфират қил ва раҳм қил. Ўзинг билган гуноҳларни мендан кечгин. Сен ғолибсан, карам соҳибисан",
          "reference": "Фатавои қозихон"
        },
        "ru": {
          "title": "Между двумя зелёными отметками",
          "transliteration": "Роббигфир, вархам. Ва тажааваз ъаммаа таълам. Иннака антал аъаззул акром",
          "translation": "Господи, прости меня и помилуй и прости грехи, о которых Ты знаешь. Ты — Всемогущий, Обладатель щедрости.",
          "reference": "Фатава Казыхан"
        }
      }
    },
    {
      "dua_arabic": "اللَّهُمَّ اسْتَعْمِلْنِي بِسُنَّةِ نَبِيِّك وَتَوَفَّنِي عَلَى مِلَّتِهِ ، وَأَعِذْنِي مِنْ مُضِلَّاتِ الْفِتَنِ بِرَحْمَتِك يَا أَرْحَمَ الرَّاحِمِينَ.",
      "translations": {
        "en": {
          "title": "After the green markers, on the way to Marwah",
          "transliteration": "Allāhumma-staʿmilnī bi-sunnati nabiyyika wa tawaffanī ʿalā millatih, wa aʿidhnī min muḍillāti-l-fitan, bi-raḥmatika yā arḥama-r-rāḥimīn.",
          "translation": "O Allah, make me one who acts by the Sunnah of Your Prophet, and by Your mercy grant me to die upon his religion. By Your mercy protect me from trials that lead astray, O Most Merciful of the merciful!",
          "reference": "Tabyin al-Haqaiq"
        },
        "uz_latin": {
          "title": "Yashil chiziqdan o‘tib, Marvaga ketayotganda",
          "transliteration": "Allohumma! Ista’milniy bi sunnati Nabiyyika va tavaffaniy ’alaa millatih. Va a’izniy min mudillaatil fitani, birohmatika yaa arhamar rohimiyn",
          "translation": "Allohim! Meni Nabiyyingning sunnatiga amal qiluvchilardan qilgin, Rahmating ila u zotning millatiga ko‘ra vafot topishni nasib qilgin. Adashtiruvchi va zalolatga olib boruvchi fitnalardan rahmating ila panoh bergin, ey mehribonlar mehriboni!",
          "reference": "Tabyiynul haqoiq"
        },
        "uz_cyr": {
          "title": "Яшил чизиқдан ўтиб, Марвага кетаётганда",
          "transliteration": "Аллоҳумма! Истаъмилний би суннати Набиййика ва таваффаний ъалаа миллатиҳ. Ва аъизний мин мудиллаатил фитани, бироҳматика йаа арҳамар роҳимийн",
          "translation": "Аллоҳим! Мени Набиййингнинг суннатига амал қилувчилардан қилгин, Раҳматинг ила у зотнинг миллатига кўра вафот топишни насиб қилгин. Адаштирувчи ва залолатга олиб борувчи фитналардан раҳматинг ила паноҳ бергин, эй меҳрибонлар меҳрибони!",
          "reference": "Табйийнул ҳақоиқ"
        },
        "ru": {
          "title": "После зелёных отметок, по пути к Марве",
          "transliteration": "Аллохумма! Истаъмилний би суннати Набиййика ва таваффаний ъалаа миллатих. Ва аъизний мин мудиллаатил фитани, бирохматика йаа архамар рохимийн",
          "translation": "О Аллах, сделай меня следующим Сунне Твоего Пророка и по Твоей милости даруй мне умереть на его религии. По Твоей милости защити меня от вводящих в заблуждение смут, о Милосерднейший из милосердных!",
          "reference": "Табйин аль-Хакаик"
        }
      }
    }
  ],
  "6": [
    {
      "dua_arabic": "اللهم بارك في نفسي واغفر لي ذنوبي واجعل لي بكل شعرة منها نورا يوم القيامة.",
      "translations": {
        "en": {
          "title": "While the hair is shaved or trimmed",
          "transliteration": "Allāhumma bārik fī nafsī waghfir lī dhunūbī, wajʿal lī bi-kulli shaʿratin minhā nūran yawma-l-qiyāmah.",
          "translation": "O Allah, bless me and forgive my sins. Make every strand of my hair a light for me on the Day of Resurrection.",
          "reference": "Fatawa Qadikhan"
        },
        "uz_latin": {
          "title": "Soch oldirayotganda",
          "transliteration": "Allohumma, baarik fiy nafsiy vag‘firliy zunuubiy, vaj’al liy bi kulli sha’rotin minhaa nuron yavmal qiyaamah",
          "translation": "Allohim! Menga baraka ato qilgin, gunohlarimni afv qilgin. Sochlarimning har tolasi evaziga qiyomat kuni men uchun bir nur qilgin",
          "reference": "Fatavoi qozixon"
        },
        "uz_cyr": {
          "title": "Соч олдираётганда",
          "transliteration": "Аллоҳумма, баарик фий нафсий вағфирлий зунуубий, важъал лий би кулли шаъротин минҳаа нурон явмал қияамаҳ",
          "translation": "Аллоҳим! Менга барака ато қилгин, гуноҳларимни афв қилгин. Сочларимнинг ҳар толаси эвазига қиёмат куни мен учун бир нур қилгин",
          "reference": "Фатавои қозихон"
        },
        "ru": {
          "title": "Во время бритья или стрижки волос",
          "transliteration": "Аллохумма, баарик фий нафсий вагфирлий зунуубий, важъал лий би кулли шаъротин минхаа нурон явмал кияамах",
          "translation": "О Аллах, благослови меня и прости мои грехи. Сделай каждый мой волос светом для меня в День воскресения.",
          "reference": "Фатава Казыхан"
        }
      }
    },
    {
      "dua_arabic": "اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ",
      "translations": {
        "en": {
          "title": "For those who shave their heads",
          "transliteration": "Allāhumma-ghfir lil-muḥalliqīn",
          "translation": "O Allah, forgive those who shave their heads.",
          "reference": null
        },
        "uz_latin": {
          "title": "Soch oldirganlar uchun",
          "transliteration": "Allahumma-ghfir lil-muhalliqin",
          "translation": "Allohim, sochini oldirganlarni mag‘firat qil.",
          "reference": null
        },
        "uz_cyr": {
          "title": "Соч олдирганлар учун",
          "transliteration": "Allahumma-ghfir lil-muhalliqin",
          "translation": "Аллоҳим, сочини олдирганларни мағфират қил.",
          "reference": null
        },
        "ru": {
          "title": "За тех, кто бреет голову",
          "transliteration": "Allahumma-ghfir lil-muhalliqin",
          "translation": "О Аллах, прости тех, кто сбрил волосы.",
          "reference": null
        }
      }
    }
  ],
  "7": [
    {
      "dua_arabic": "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَات",
      "translations": {
        "en": {
          "title": "On completing the Umrah",
          "transliteration": "Al-ḥamdu lillāhi-lladhī bi-niʿmatihi tatimmu-ṣ-ṣāliḥāt",
          "translation": "Praise be to Allah by whose grace good deeds are completed.",
          "reference": null
        },
        "uz_latin": {
          "title": "Umrani yakunlaganda",
          "transliteration": "Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat",
          "translation": "Yaxshi ishlar Uning ne‘mati bilan tugaydigan Allohga hamd bo‘lsin.",
          "reference": null
        },
        "uz_cyr": {
          "title": "Умрани якунлаганда",
          "transliteration": "Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat",
          "translation": "Яхши ишлар Унинг неъмати билан тугайдиган Аллоҳга ҳамд бўлсин.",
          "reference": null
        },
        "ru": {
          "title": "По завершении Умры",
          "transliteration": "Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat",
          "translation": "Хвала Аллаху, по милости Которого завершаются благие дела.",
          "reference": null
        }
      }
    }
  ]
};

/** Tawaf circuits (step sort_order 2). */
const CIRCUITS: Array<{ sort_order: number; dua_arabic: string; translations: Record<string, Record<string, string | null>>; duas: Dua[] }> = [
  {
    "sort_order": 1,
    "dua_arabic": "سُبْحَانَ اللّهِ، والحمدُ للَّهِ، ولا إِله إِلاَّ اللّهُ، واللّهُ أَكبرُ، ولا حَوْلَ ولا قُوَّةَ إِلاَّ باللَّهِ العَليِّ العظيم. والصلوة والسلام على رسول الله صلّى الله عليه وسلم اللهم ايمانا بك وتصديقا بكلماتك ووفاء بعهدك واتباعا لسنة نبيك وحبيبك سيدنا محمد صلّى الله عليه وسلم اللهم اني أسألك العفو والعافية والمعافاة الدائمة في الدين والدنيا والآخرة والفوز بالجنة والنجاة من النار.",
    "translations": {
      "en": {
        "title": "Circuit 1",
        "instructions": "Start at the Black Stone. Face it, raise your hands and say “Bismillāh, Allāhu Akbar”, then begin with the Kaaba on your left. Men walk briskly (raml) — this is the first of three raml rounds.",
        "note": "Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited.",
        "dua_transliteration": "Subḥāna-llāh, wal-ḥamdu lillāh, wa lā ilāha illa-llāh, wa-llāhu akbar, wa lā ḥawla wa lā quwwata illā billāhi-l-ʿaliyyi-l-ʿaẓīm. Waṣ-ṣalātu was-salāmu ʿalā Rasūlillāhi ṣalla-llāhu ʿalayhi wa sallam. Allāhumma īmānan bika wa taṣdīqan bi-kalimātika wa wafāʾan bi-ʿahdika wa-ttibāʿan li-sunnati nabiyyika wa ḥabībika sayyidinā Muḥammadin ṣalla-llāhu ʿalayhi wa sallam. Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata wal-muʿāfāta-d-dāʾimata fi-d-dīni wa-d-dunyā wal-ākhirah, wal-fawza bil-jannati wan-najāta mina-n-nār.",
        "dua_translation": "Allah is free of every fault and imperfection. All praise belongs to Allah. There is no god but Allah. Allah is the Greatest. The strength to obey and the strength to keep away from sin come only from Allah, the Most High, the Most Great. Blessings and peace be upon the Messenger of Allah ﷺ. O Allah, (I perform the Tawaf) believing in You, affirming Your Book, fulfilling Your covenant and following the Sunnah of Your Prophet. O Allah, I ask You for pardon and well-being, lasting forgiveness in religion, this world and the Hereafter, attaining Paradise and salvation from the Fire."
      },
      "uz_latin": {
        "title": "1-aylanish",
        "instructions": "Qora Toshdan boshlang. Unga yuzlanib, qo‘llaringizni ko‘tarib “Bismillah, Allohu Akbar” deng, so‘ng Ka‘bani chap tomoningizda qoldirib boshlang. Erkaklar tez yuradi (raml) — bu uchta raml aylanishning birinchisi.",
        "note": "Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi.",
        "dua_transliteration": "Subhaanalloh, valhamdulillaah, va laa ilaaha illalloh, vallohu akbar. Va laa havla va laa quvvata illa billaahil ’aliyyil ’aziym. Vassolaatu vassalaamu ’alaa Rasulillaahi sollallohu alayhi vasallam. Allohumma, iymaanan bika va tasdiyqon bikalimaatika va vafaan bi’ahdika va ittibaa’an lisunnati Nabiyyika va habibika, sayyidina Muhammadin sollallohu ’alayhi vasallam. Allohumma, inniy as’alukal ’afva val ofiyata val ma’ofatad-daaimata fid-diyni vad-dunya val aaxiroti val favzu bil jannati van-najaatu minan-naar",
        "dua_translation": "Alloh barcha aybu nuqsonlardan pokdir. Barcha maqtovlar Allohgadir. Allohdan o‘zga iloh yo‘q. Alloh ulug‘dir. Toatga quvvat ham, gunohdan saqlanishga bo‘lgan quvvat ham yolg‘il aliyul azim bo‘lgan Alloh taolo tarafidandir. Rasululloh sollallohu alayhi vasallamga salavotu salomlar bo‘lsin. Allohim! Senga iymon keltirib, kitobingni tasdiq qilib, ahdingga vafo qilib, Nabiyingning sunnatiga ergashib (tavof qilaman). Allohim, Sendan dinu dunyo va oxiratda afv va ofiyatni, abadiy kechirishingni hamda jannatga erishib, do‘zaxdan najot topishimni so‘rayman."
      },
      "uz_cyr": {
        "title": "1-айланиш",
        "instructions": "Қора Тошдан бошланг. Унга юзланиб, қўлларингизни кўтариб “Бисмиллаҳ, Аллоҳу Акбар” денг, сўнг Каъбани чап томонингизда қолдириб бошланг. Эркаклар тез юради (рамл) — бу учта рамл айланишнинг биринчиси.",
        "note": "Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади.",
        "dua_transliteration": "Субҳааналлоҳ, валҳамдулиллааҳ, ва лаа илааҳа иллаллоҳ, валлоҳу акбар. Ва лаа ҳавла ва лаа қуввата илла биллааҳил ъалиййил ъазийм. Вассолаату вассалааму ъалаа Расулиллааҳи соллаллоҳу алайҳи васаллам. Аллоҳумма, иймаанан бика ва тасдийқон бикалимаатика ва вафаан биъаҳдика ва иттибааъан лисуннати Набиййика ва ҳабибика, саййидина Муҳаммадин соллаллоҳу ъалайҳи васаллам. Аллоҳумма, инний асъалукал ъафва вал офията вал маъофатад-дааимата фид-дийни вад-дуня вал аахироти вал фавзу бил жаннати ван-нажаату минан-наар",
        "dua_translation": "Аллоҳ барча айбу нуқсонлардан покдир. Барча мақтовлар Аллоҳгадир. Аллоҳдан ўзга илоҳ йўқ. Аллоҳ улуғдир. Тоатга қувват ҳам, гуноҳдан сақланишга бўлган қувват ҳам ёлғил алиюл азим бўлган Аллоҳ таоло тарафидандир. Расулуллоҳ соллаллоҳу алайҳи васалламга салавоту саломлар бўлсин. Аллоҳим! Сенга иймон келтириб, китобингни тасдиқ қилиб, аҳдингга вафо қилиб, Набийингнинг суннатига эргашиб (тавоф қиламан). Аллоҳим, Сендан дину дунё ва охиратда афв ва офиятни, абадий кечиришингни ҳамда жаннатга эришиб, дўзахдан нажот топишимни сўрайман."
      },
      "ru": {
        "title": "Круг 1",
        "instructions": "Начните у Чёрного камня. Повернитесь к нему, поднимите руки и скажите «Бисмиллях, Аллаху Акбар», затем идите, держа Каабу слева. Мужчины идут быстрым шагом (рамаль) — это первый из трёх кругов рамаля.",
        "note": "Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа.",
        "dua_transliteration": "Субхааналлох, валхамдулиллаах, ва лаа илааха иллаллох, валлоху акбар. Ва лаа хавла ва лаа куввата илла биллаахил ъалиййил ъазийм. Вассолаату вассалааму ъалаа Расулиллаахи соллаллоху алайхи васаллам. Аллохумма, иймаанан бика ва тасдийкон бикалимаатика ва вафаан биъахдика ва иттибааъан лисуннати Набиййика ва хабибика, саййидина Мухаммадин соллаллоху ъалайхи васаллам. Аллохумма, инний асъалукал ъафва вал офията вал маъофатад-дааимата фид-дийни вад-дуня вал аахироти вал фавзу бил жаннати ван-нажаату минан-наар",
        "dua_translation": "Аллах свободен от всех недостатков. Вся хвала принадлежит Аллаху. Нет божества, кроме Аллаха. Аллах велик. Сила к покорности и сила удержаться от греха — только от Аллаха, Всевышнего, Великого. Благословение и мир Посланнику Аллаха ﷺ. О Аллах, (совершаю таваф) веруя в Тебя, признавая истинность Твоей Книги, исполняя завет с Тобой и следуя Сунне Твоего Пророка. О Аллах, прошу у Тебя прощения и благополучия, вечного прощения в религии, в этом мире и в вечной жизни, обретения Рая и спасения от Огня."
      }
    },
    "duas": [
      {
        "dua_arabic": "سُبْحَانَ اللّهِ، والحمدُ للَّهِ، ولا إِله إِلاَّ اللّهُ، واللّهُ أَكبرُ، ولا حَوْلَ ولا قُوَّةَ إِلاَّ باللَّهِ العَليِّ العظيم. والصلوة والسلام على رسول الله صلّى الله عليه وسلم اللهم ايمانا بك وتصديقا بكلماتك ووفاء بعهدك واتباعا لسنة نبيك وحبيبك سيدنا محمد صلّى الله عليه وسلم اللهم اني أسألك العفو والعافية والمعافاة الدائمة في الدين والدنيا والآخرة والفوز بالجنة والنجاة من النار.",
        "translations": {
          "en": {
            "title": "Du‘a of circuit 1",
            "transliteration": "Subḥāna-llāh, wal-ḥamdu lillāh, wa lā ilāha illa-llāh, wa-llāhu akbar, wa lā ḥawla wa lā quwwata illā billāhi-l-ʿaliyyi-l-ʿaẓīm. Waṣ-ṣalātu was-salāmu ʿalā Rasūlillāhi ṣalla-llāhu ʿalayhi wa sallam. Allāhumma īmānan bika wa taṣdīqan bi-kalimātika wa wafāʾan bi-ʿahdika wa-ttibāʿan li-sunnati nabiyyika wa ḥabībika sayyidinā Muḥammadin ṣalla-llāhu ʿalayhi wa sallam. Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata wal-muʿāfāta-d-dāʾimata fi-d-dīni wa-d-dunyā wal-ākhirah, wal-fawza bil-jannati wan-najāta mina-n-nār.",
            "translation": "Allah is free of every fault and imperfection. All praise belongs to Allah. There is no god but Allah. Allah is the Greatest. The strength to obey and the strength to keep away from sin come only from Allah, the Most High, the Most Great. Blessings and peace be upon the Messenger of Allah ﷺ. O Allah, (I perform the Tawaf) believing in You, affirming Your Book, fulfilling Your covenant and following the Sunnah of Your Prophet. O Allah, I ask You for pardon and well-being, lasting forgiveness in religion, this world and the Hereafter, attaining Paradise and salvation from the Fire.",
            "reference": null
          },
          "uz_latin": {
            "title": "1-aylanish duosi",
            "transliteration": "Subhaanalloh, valhamdulillaah, va laa ilaaha illalloh, vallohu akbar. Va laa havla va laa quvvata illa billaahil ’aliyyil ’aziym. Vassolaatu vassalaamu ’alaa Rasulillaahi sollallohu alayhi vasallam. Allohumma, iymaanan bika va tasdiyqon bikalimaatika va vafaan bi’ahdika va ittibaa’an lisunnati Nabiyyika va habibika, sayyidina Muhammadin sollallohu ’alayhi vasallam. Allohumma, inniy as’alukal ’afva val ofiyata val ma’ofatad-daaimata fid-diyni vad-dunya val aaxiroti val favzu bil jannati van-najaatu minan-naar",
            "translation": "Alloh barcha aybu nuqsonlardan pokdir. Barcha maqtovlar Allohgadir. Allohdan o‘zga iloh yo‘q. Alloh ulug‘dir. Toatga quvvat ham, gunohdan saqlanishga bo‘lgan quvvat ham yolg‘il aliyul azim bo‘lgan Alloh taolo tarafidandir. Rasululloh sollallohu alayhi vasallamga salavotu salomlar bo‘lsin. Allohim! Senga iymon keltirib, kitobingni tasdiq qilib, ahdingga vafo qilib, Nabiyingning sunnatiga ergashib (tavof qilaman). Allohim, Sendan dinu dunyo va oxiratda afv va ofiyatni, abadiy kechirishingni hamda jannatga erishib, do‘zaxdan najot topishimni so‘rayman.",
            "reference": null
          },
          "uz_cyr": {
            "title": "1-айланиш дуоси",
            "transliteration": "Субҳааналлоҳ, валҳамдулиллааҳ, ва лаа илааҳа иллаллоҳ, валлоҳу акбар. Ва лаа ҳавла ва лаа қуввата илла биллааҳил ъалиййил ъазийм. Вассолаату вассалааму ъалаа Расулиллааҳи соллаллоҳу алайҳи васаллам. Аллоҳумма, иймаанан бика ва тасдийқон бикалимаатика ва вафаан биъаҳдика ва иттибааъан лисуннати Набиййика ва ҳабибика, саййидина Муҳаммадин соллаллоҳу ъалайҳи васаллам. Аллоҳумма, инний асъалукал ъафва вал офията вал маъофатад-дааимата фид-дийни вад-дуня вал аахироти вал фавзу бил жаннати ван-нажаату минан-наар",
            "translation": "Аллоҳ барча айбу нуқсонлардан покдир. Барча мақтовлар Аллоҳгадир. Аллоҳдан ўзга илоҳ йўқ. Аллоҳ улуғдир. Тоатга қувват ҳам, гуноҳдан сақланишга бўлган қувват ҳам ёлғил алиюл азим бўлган Аллоҳ таоло тарафидандир. Расулуллоҳ соллаллоҳу алайҳи васалламга салавоту саломлар бўлсин. Аллоҳим! Сенга иймон келтириб, китобингни тасдиқ қилиб, аҳдингга вафо қилиб, Набийингнинг суннатига эргашиб (тавоф қиламан). Аллоҳим, Сендан дину дунё ва охиратда афв ва офиятни, абадий кечиришингни ҳамда жаннатга эришиб, дўзахдан нажот топишимни сўрайман.",
            "reference": null
          },
          "ru": {
            "title": "Дуа 1-го круга",
            "transliteration": "Субхааналлох, валхамдулиллаах, ва лаа илааха иллаллох, валлоху акбар. Ва лаа хавла ва лаа куввата илла биллаахил ъалиййил ъазийм. Вассолаату вассалааму ъалаа Расулиллаахи соллаллоху алайхи васаллам. Аллохумма, иймаанан бика ва тасдийкон бикалимаатика ва вафаан биъахдика ва иттибааъан лисуннати Набиййика ва хабибика, саййидина Мухаммадин соллаллоху ъалайхи васаллам. Аллохумма, инний асъалукал ъафва вал офията вал маъофатад-дааимата фид-дийни вад-дуня вал аахироти вал фавзу бил жаннати ван-нажаату минан-наар",
            "translation": "Аллах свободен от всех недостатков. Вся хвала принадлежит Аллаху. Нет божества, кроме Аллаха. Аллах велик. Сила к покорности и сила удержаться от греха — только от Аллаха, Всевышнего, Великого. Благословение и мир Посланнику Аллаха ﷺ. О Аллах, (совершаю таваф) веруя в Тебя, признавая истинность Твоей Книги, исполняя завет с Тобой и следуя Сунне Твоего Пророка. О Аллах, прошу у Тебя прощения и благополучия, вечного прощения в религии, в этом мире и в вечной жизни, обретения Рая и спасения от Огня.",
            "reference": null
          }
        }
      },
      {
        "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَفِي الْآخِرَةِ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وأدخلنا الجنة مع الأبرار يا عزيز يا غفار يا رب العالمين.",
        "translations": {
          "en": {
            "title": "Between the Yemeni Corner and the Black Stone",
            "transliteration": "Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.",
            "translation": "O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!",
            "reference": null
          },
          "uz_latin": {
            "title": "Rukni Yamoniy bilan Hajarul Asvad orasida",
            "transliteration": "Allohumma, inniy as’alukal ’afva val ofiyata fid-dunyaya va fil aaxiro. Robbana! Aatinaa fid-dunyaa hasanatan, va fil aaxiroti hasanatan va qinaa ’azaaban-naar. Va adxilnal jannata ma’al abror, yaa Azizu, yaa G‘offaar, yaa Robbal ’aalamiyn",
            "translation": "Allohim! Sendan dunyoyu oxiratda afv va ofiyatni so‘rayman. Robbimiz! Bizlarga dunyoda ham, oxiratda ham yaxshilikni ato qilib, bizlarni do‘zax azobidan saqlagin. Bizlarni abror bandalaring bilan jannatga kirgazgin, ey Aziz, ey G‘affor, ey olamlarning Robbi!",
            "reference": null
          },
          "uz_cyr": {
            "title": "Рукни Ямоний билан Ҳажарул Асвад орасида",
            "transliteration": "Аллоҳумма, инний асъалукал ъафва вал офията фид-дуняя ва фил аахиро. Роббана! Аатинаа фид-дунйаа ҳасанатан, ва фил аахироти ҳасанатан ва қинаа ъазаабан-наар. Ва адхилнал жанната маъал аброр, йаа Азизу, йаа Ғоффаар, йаа Роббал ъааламийн",
            "translation": "Аллоҳим! Сендан дунёю охиратда афв ва офиятни сўрайман. Роббимиз! Бизларга дунёда ҳам, охиратда ҳам яхшиликни ато қилиб, бизларни дўзах азобидан сақлагин. Бизларни аброр бандаларинг билан жаннатга киргазгин, эй Азиз, эй Ғаффор, эй оламларнинг Робби!",
            "reference": null
          },
          "ru": {
            "title": "Между Йеменским углом и Чёрным камнем",
            "transliteration": "Аллохумма, инний асъалукал ъафва вал офията фид-дуняя ва фил аахиро. Роббана! Аатинаа фид-дунйаа хасанатан, ва фил аахироти хасанатан ва кинаа ъазаабан-наар. Ва адхилнал жанната маъал аброр, йаа Азизу, йаа Гоффаар, йаа Роббал ъааламийн",
            "translation": "О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!",
            "reference": null
          }
        }
      }
    ]
  },
  {
    "sort_order": 2,
    "dua_arabic": "اللَّهُمَّ إنَّ هَذَا الْبَيْتَ بَيْتُك وَالْحَرَمَ حَرَمُك والامن امنك وَالْعَبْدَ عَبْدُك وأنا عبدك وابن عبدِكَ وَهَذَا مَقَامُ الْعَائِذِ بِك مِنْ النَّارِ وحرم لحومنا وبشرتنا على النار اللَّهُمَّ حَبِّبْ إِلَيْنَا الإِيمَانَ ، وَزَيِّنْهُ فِي قُلُوبِنَا ، وَكَرِّهْ إِلَيْنَا الْكُفْرَ وَالْفُسُوقَ وَالْعِصْيَانَ ، وَاجْعَلْنَا مِنَ الرَّاشِدِينَ اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ اللَّهُمَّ ارزقني الْجنَّة بِغَيْرِ حِسَابٍ.",
    "translations": {
      "en": {
        "title": "Circuit 2",
        "instructions": "Begin again at the Black Stone with istilām — point to it and say “Allāhu Akbar”. Continue at a brisk pace (raml). Touch the Yemeni Corner if you can reach it without crowding others.",
        "note": "Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited. Do not kiss the Yemeni Corner; touching it is enough.",
        "dua_transliteration": "Allāhumma inna hādha-l-bayta baytuka, wal-ḥarama ḥaramuka, wal-amna amnuka, wal-ʿabda ʿabduka, wa ana ʿabduka wa-bnu ʿabdika, wa hādhā maqāmu-l-ʿāʾidhi bika mina-n-nār, wa ḥarrim luḥūmanā wa basharatanā ʿala-n-nār. Allāhumma ḥabbib ilayna-l-īmāna wa zayyinhu fī qulūbinā, wa karrih ilayna-l-kufra wal-fusūqa wal-ʿiṣyān, wajʿalnā mina-r-rāshidīn. Allāhumma qinī ʿadhābaka yawma tabʿathu ʿibādak. Allāhumma-rzuqniya-l-jannata bi-ghayri ḥisāb.",
        "dua_translation": "O Allah, this House is Your House, and the Sanctuary is Your Sanctuary. The safety here is the safety You established. The servant is Your servant, and I am Your servant and the son of Your servant. This is the place of one who seeks refuge in You from the Fire. Make our flesh and our skin forbidden to the Fire. O Allah, make faith beloved to us and beautify it in our hearts; make disbelief, wickedness and sin hateful to us, and place us among the rightly guided."
      },
      "uz_latin": {
        "title": "2-aylanish",
        "instructions": "Yana Qora Toshdan istilom bilan boshlang — unga ishora qilib “Allohu Akbar” deng. Tez yurishda (raml) davom eting. Imkon bo‘lsa, boshqalarga xalaqit bermay Yamaniy burchakka qo‘l tegizing.",
        "note": "Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi. Yamaniy burchakni o‘pmang; unga qo‘l tegizish kifoya.",
        "dua_transliteration": "Allohumma! Inna haazal Bayta Baytuka, val Haroma Haromuka, val amnu amnuka, val ’abda ’abduka, va ana ’abduka vabnu ’abdika, va haaza maqomul ’oizi bika minan-naar. Va harrim luhuumana va basharotanaa ’alan-naar. Allohumma! Habbib ilaynal-iymaana va zayyinhu fiy quluubinaa, va karrih ilaynal-kufro val-fusuuqo val-’isyaana, vaj’alnaa minar-roshidiyn. Allohumma! Qiniy ’azaabaka yavma tab’asu ’ibaadak. Allohummarzuqniyl jannata big‘oyri hisaab",
        "dua_translation": "Allohim, bu Bayt Sening Baytingdir, va haram Sening haramingdir. Bu yerdagi omonlikni Sen qoim qilgansan. Banda Sening bandangdir va men Sening bandang va bandangning farzandiman. Bu joy Sening madading ila do‘zaxdan panoh so‘raladigan joydir. Go‘shtlarimizni, terilarimizni do‘zaxga harom qilgin. Allohim! Bizlarga iymonni suyukli qilgin. Qalblarimizga uni chiroyli ko‘rsatgin. Bizlarni kufr, fisq va gunohdan nafratlantir hamda bizlarni hidoyat topguvchilar safida qil"
      },
      "uz_cyr": {
        "title": "2-айланиш",
        "instructions": "Яна Қора Тошдан истилом билан бошланг — унга ишора қилиб “Аллоҳу Акбар” денг. Тез юришда (рамл) давом этинг. Имкон бўлса, бошқаларга халақит бермай Ямоний бурчакка қўл тегизинг.",
        "note": "Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади. Ямоний бурчакни ўпманг; унга қўл тегизиш кифоя.",
        "dua_transliteration": "Аллоҳумма! Инна ҳаазал Байта Байтука, вал Ҳарома Ҳаромука, вал амну амнука, вал ъабда ъабдука, ва ана ъабдука вабну ъабдика, ва ҳааза мақомул ъоизи бика минан-наар. Ва ҳаррим луҳуумана ва башаротанаа ъалан-наар. Аллоҳумма! Ҳаббиб илайнал-иймаана ва заййинҳу фий қулуубинаа, ва карриҳ илайнал-куфро вал-фусууқо вал-ъисйаана, важъалнаа минар-рошидийн. Аллоҳумма! Қиний ъазаабака йавма табъасу ъибаадак. Аллоҳуммарзуқнийл жанната биғойри ҳисааб",
        "dua_translation": "Аллоҳим, бу Байт Сенинг Байтингдир, ва ҳарам Сенинг ҳарамингдир. Бу ердаги омонликни Сен қоим қилгансан. Банда Сенинг бандангдир ва мен Сенинг банданг ва бандангнинг фарзандиман. Бу жой Сенинг мададинг ила дўзахдан паноҳ сўраладиган жойдир. Гўштларимизни, териларимизни дўзахга ҳаром қилгин. Аллоҳим! Бизларга иймонни суюкли қилгин. Қалбларимизга уни чиройли кўрсатгин. Бизларни куфр, фисқ ва гуноҳдан нафратлантир ҳамда бизларни ҳидоят топгувчилар сафида қил"
      },
      "ru": {
        "title": "Круг 2",
        "instructions": "Снова начните у Чёрного камня с истиляма — укажите на него и скажите «Аллаху Акбар». Продолжайте быстрым шагом (рамаль). Коснитесь Йеменского угла, если можете, не тесня других.",
        "note": "Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа. Йеменский угол не целуют; достаточно коснуться.",
        "dua_transliteration": "Аллохумма! Инна хаазал Байта Байтука, вал Харома Харомука, вал амну амнука, вал ъабда ъабдука, ва ана ъабдука вабну ъабдика, ва хааза макомул ъоизи бика минан-наар. Ва харрим лухуумана ва башаротанаа ъалан-наар. Аллохумма! Хаббиб илайнал-иймаана ва заййинху фий кулуубинаа, ва каррих илайнал-куфро вал-фусууко вал-ъисйаана, важъалнаа минар-рошидийн. Аллохумма! Киний ъазаабака йавма табъасу ъибаадак. Аллохуммарзукнийл жанната бигойри хисааб",
        "dua_translation": "О Аллах, этот Дом — Твой Дом, а заповедная территория — Твоя. Безопасность здесь установил Ты. Раб — Твой раб, и я Твой раб и сын Твоего раба. Это место того, кто ищет у Тебя защиты от Огня. Сделай нашу плоть и нашу кожу запретными для Огня. О Аллах, сделай веру любимой для нас и укрась её в наших сердцах, сделай ненавистными для нас неверие, нечестие и грех и включи нас в число идущих прямым путём."
      }
    },
    "duas": [
      {
        "dua_arabic": "اللَّهُمَّ إنَّ هَذَا الْبَيْتَ بَيْتُك وَالْحَرَمَ حَرَمُك والامن امنك وَالْعَبْدَ عَبْدُك وأنا عبدك وابن عبدِكَ وَهَذَا مَقَامُ الْعَائِذِ بِك مِنْ النَّارِ وحرم لحومنا وبشرتنا على النار اللَّهُمَّ حَبِّبْ إِلَيْنَا الإِيمَانَ ، وَزَيِّنْهُ فِي قُلُوبِنَا ، وَكَرِّهْ إِلَيْنَا الْكُفْرَ وَالْفُسُوقَ وَالْعِصْيَانَ ، وَاجْعَلْنَا مِنَ الرَّاشِدِينَ اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ اللَّهُمَّ ارزقني الْجنَّة بِغَيْرِ حِسَابٍ.",
        "translations": {
          "en": {
            "title": "Du‘a of circuit 2",
            "transliteration": "Allāhumma inna hādha-l-bayta baytuka, wal-ḥarama ḥaramuka, wal-amna amnuka, wal-ʿabda ʿabduka, wa ana ʿabduka wa-bnu ʿabdika, wa hādhā maqāmu-l-ʿāʾidhi bika mina-n-nār, wa ḥarrim luḥūmanā wa basharatanā ʿala-n-nār. Allāhumma ḥabbib ilayna-l-īmāna wa zayyinhu fī qulūbinā, wa karrih ilayna-l-kufra wal-fusūqa wal-ʿiṣyān, wajʿalnā mina-r-rāshidīn. Allāhumma qinī ʿadhābaka yawma tabʿathu ʿibādak. Allāhumma-rzuqniya-l-jannata bi-ghayri ḥisāb.",
            "translation": "O Allah, this House is Your House, and the Sanctuary is Your Sanctuary. The safety here is the safety You established. The servant is Your servant, and I am Your servant and the son of Your servant. This is the place of one who seeks refuge in You from the Fire. Make our flesh and our skin forbidden to the Fire. O Allah, make faith beloved to us and beautify it in our hearts; make disbelief, wickedness and sin hateful to us, and place us among the rightly guided.",
            "reference": null
          },
          "uz_latin": {
            "title": "2-aylanish duosi",
            "transliteration": "Allohumma! Inna haazal Bayta Baytuka, val Haroma Haromuka, val amnu amnuka, val ’abda ’abduka, va ana ’abduka vabnu ’abdika, va haaza maqomul ’oizi bika minan-naar. Va harrim luhuumana va basharotanaa ’alan-naar. Allohumma! Habbib ilaynal-iymaana va zayyinhu fiy quluubinaa, va karrih ilaynal-kufro val-fusuuqo val-’isyaana, vaj’alnaa minar-roshidiyn. Allohumma! Qiniy ’azaabaka yavma tab’asu ’ibaadak. Allohummarzuqniyl jannata big‘oyri hisaab",
            "translation": "Allohim, bu Bayt Sening Baytingdir, va haram Sening haramingdir. Bu yerdagi omonlikni Sen qoim qilgansan. Banda Sening bandangdir va men Sening bandang va bandangning farzandiman. Bu joy Sening madading ila do‘zaxdan panoh so‘raladigan joydir. Go‘shtlarimizni, terilarimizni do‘zaxga harom qilgin. Allohim! Bizlarga iymonni suyukli qilgin. Qalblarimizga uni chiroyli ko‘rsatgin. Bizlarni kufr, fisq va gunohdan nafratlantir hamda bizlarni hidoyat topguvchilar safida qil",
            "reference": null
          },
          "uz_cyr": {
            "title": "2-айланиш дуоси",
            "transliteration": "Аллоҳумма! Инна ҳаазал Байта Байтука, вал Ҳарома Ҳаромука, вал амну амнука, вал ъабда ъабдука, ва ана ъабдука вабну ъабдика, ва ҳааза мақомул ъоизи бика минан-наар. Ва ҳаррим луҳуумана ва башаротанаа ъалан-наар. Аллоҳумма! Ҳаббиб илайнал-иймаана ва заййинҳу фий қулуубинаа, ва карриҳ илайнал-куфро вал-фусууқо вал-ъисйаана, важъалнаа минар-рошидийн. Аллоҳумма! Қиний ъазаабака йавма табъасу ъибаадак. Аллоҳуммарзуқнийл жанната биғойри ҳисааб",
            "translation": "Аллоҳим, бу Байт Сенинг Байтингдир, ва ҳарам Сенинг ҳарамингдир. Бу ердаги омонликни Сен қоим қилгансан. Банда Сенинг бандангдир ва мен Сенинг банданг ва бандангнинг фарзандиман. Бу жой Сенинг мададинг ила дўзахдан паноҳ сўраладиган жойдир. Гўштларимизни, териларимизни дўзахга ҳаром қилгин. Аллоҳим! Бизларга иймонни суюкли қилгин. Қалбларимизга уни чиройли кўрсатгин. Бизларни куфр, фисқ ва гуноҳдан нафратлантир ҳамда бизларни ҳидоят топгувчилар сафида қил",
            "reference": null
          },
          "ru": {
            "title": "Дуа 2-го круга",
            "transliteration": "Аллохумма! Инна хаазал Байта Байтука, вал Харома Харомука, вал амну амнука, вал ъабда ъабдука, ва ана ъабдука вабну ъабдика, ва хааза макомул ъоизи бика минан-наар. Ва харрим лухуумана ва башаротанаа ъалан-наар. Аллохумма! Хаббиб илайнал-иймаана ва заййинху фий кулуубинаа, ва каррих илайнал-куфро вал-фусууко вал-ъисйаана, важъалнаа минар-рошидийн. Аллохумма! Киний ъазаабака йавма табъасу ъибаадак. Аллохуммарзукнийл жанната бигойри хисааб",
            "translation": "О Аллах, этот Дом — Твой Дом, а заповедная территория — Твоя. Безопасность здесь установил Ты. Раб — Твой раб, и я Твой раб и сын Твоего раба. Это место того, кто ищет у Тебя защиты от Огня. Сделай нашу плоть и нашу кожу запретными для Огня. О Аллах, сделай веру любимой для нас и укрась её в наших сердцах, сделай ненавистными для нас неверие, нечестие и грех и включи нас в число идущих прямым путём.",
            "reference": null
          }
        }
      },
      {
        "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَفِي الْآخِرَةِ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وأدخلنا الجنة مع الأبرار يا عزيز يا غفار يا رب العالمين.",
        "translations": {
          "en": {
            "title": "Between the Yemeni Corner and the Black Stone",
            "transliteration": "Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.",
            "translation": "O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!",
            "reference": null
          },
          "uz_latin": {
            "title": "Rukni Yamoniy bilan Hajarul Asvad orasida",
            "transliteration": "Allohumma! Inniy as’alukal ’afva val-ofiyata fid-dunyaa va fil-aaxiro. Robbanaa! Aatinaa fid-dunyaa hasanatan va fil-aaxiroti hasanatan va qinaa ’azaaban-naar. Vadxilnaal jannata ma’al-abror, yaa ’aziyz, yaa G‘offar, yaa Robbal ’aalamiyn!",
            "translation": "Allohim! Sendan dunyoyu oxiratda afv va ofiyat so‘rayman. Ey Robbimiz! Bizlarga dunyoda ham, oxiratda ham yaxshilik ato qilib, bizlarni do‘zax azobidan saqlagin. Bizlarni abror bandalaring bilan jannatga kirgazgin, ey Aziz, ey G‘affor, ey olamlar Robbi!",
            "reference": null
          },
          "uz_cyr": {
            "title": "Рукни Ямоний билан Ҳажарул Асвад орасида",
            "transliteration": "Аллоҳумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа ҳасанатан ва фил-аахироти ҳасанатан ва қинаа ъазаабан-наар. Вадхилнаал жанната маъал-аброр, йаа Ъазийз, йаа Ғоффар, йаа Роббал ъааламийн!",
            "translation": "Аллоҳим! Сендан дунёю охиратда афв ва офият сўрайман. Эй Роббимиз! Бизларга дунёда ҳам, охиратда ҳам яхшилик ато қилиб, бизларни дўзах азобидан сақлагин. Бизларни аброр бандаларинг билан жаннатга киргазгин, эй Азиз, эй Ғаффор, эй оламлар Робби!",
            "reference": null
          },
          "ru": {
            "title": "Между Йеменским углом и Чёрным камнем",
            "transliteration": "Аллохумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа хасанатан ва фил-аахироти хасанатан ва кинаа ъазаабан-наар. Вадхилнаал жанната маъал-аброр, йаа Ъазийз, йаа Гоффар, йаа Роббал ъааламийн!",
            "translation": "О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!",
            "reference": null
          }
        }
      }
    ]
  },
  {
    "sort_order": 3,
    "dua_arabic": "اللهم إنِّي أَعُوذُ بِكَ مِنْ الشَّكِّ وَالشِّرْكِ وَالنِّفَاقِ وَالشِّقَاقِ وَسُوءِ الْأَخْلَاقِ وَسُوءِ المنظَرِ والْمُنْقَلَبِ فِي الْمَالِ وَالْأَهْلِ وَالْوَلَدِ اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ فِتْنَةِ الْقَبْرِ وَأَعُوذ بك من فتْنَة الْمحيا وَالْمَمَات وَأَعُوذُ بِك مِنْ الْخِزْيِ فِي الدُّنْيَا وَالْآخِرَةِ.",
    "translations": {
      "en": {
        "title": "Circuit 3",
        "instructions": "Third and final raml round. Salute the Black Stone at the start, then keep the brisk pace. After this round the brisk walking ends and you continue normally.",
        "note": "Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited.",
        "dua_transliteration": "Allāhumma innī aʿūdhu bika mina-sh-shakki wa-sh-shirki wa-n-nifāqi wa-sh-shiqāqi wa sūʾi-l-akhlāq, wa sūʾi-l-manẓari wal-munqalabi fi-l-māli wal-ahli wal-walad. Allāhumma innī aʿūdhu bika min fitnati-l-qabr, wa aʿūdhu bika min fitnati-l-maḥyā wal-mamāt, wa aʿūdhu bika mina-l-khizyi fi-d-dunyā wal-ākhirah.",
        "dua_translation": "O Allah, I seek refuge in You from doubt, from associating partners with You, from opposing Your command, from hypocrisy, from bad character, and from an evil sight when I return to my wealth, my family and my children. O Allah, I seek refuge in You from the trial of the grave, from the trials of life and death, and from disgrace in this world and the Hereafter."
      },
      "uz_latin": {
        "title": "3-aylanish",
        "instructions": "Uchinchi va oxirgi raml aylanishi. Boshida Qora Toshga istilom qiling, so‘ng tez yurishni saqlang. Shu aylanishdan keyin tez yurish tugaydi, oddiy davom etasiz.",
        "note": "Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi.",
        "dua_transliteration": "Allohumma! Inniy a’uuzu bika minash-shakki vash-shirki van-nifaaqi va suuil-axloqi va suuil-manzori val-munqolibi fil-maali val-ahli val-valad. Allohumma! Inniy a’uuzu bika min fitnatil-qobri va a’uuzu bika min fitnatil-mahyaa val-mamaati va a’uuzu bika minal xizyi fid-dunyaa val-aaxiro",
        "dua_translation": "Allohim! Shakka tushishdan, shirkdan, amringga xilof qilishdan, munofiqlikdan, yomon xulqdan, molim, ahlim va farzandimga qaytganda xunuk holatga duchor bo‘lishdan panoh so‘rayman. Allohim! Qabr fitnasidan, hayot va mamot fitnasidan hamda dunyoyu oxirat xorliklaridan panoh so‘rayman"
      },
      "uz_cyr": {
        "title": "3-айланиш",
        "instructions": "Учинчи ва охирги рамл айланиши. Бошида Қора Тошга истилом қилинг, сўнг тез юришни сақланг. Шу айланишдан кейин тез юриш тугайди, оддий давом этасиз.",
        "note": "Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади.",
        "dua_transliteration": "Аллоҳумма! Инний аъуузу бика минаш-шакки ваш-ширки ван-нифаақи ва сууил-ахлоқи ва сууил-манзори вал-мунқолиби фил-маали вал-аҳли вал-валад. Аллоҳумма! Инний аъуузу бика мин фитнатил-қобри ва аъуузу бика мин фитнатил-маҳйаа вал-мамаати ва аъуузу бика минал хизйи фид-дунйаа вал-аахиро",
        "dua_translation": "Аллоҳим! Шакка тушишдан, ширкдан, амрингга хилоф қилишдан, мунофиқликдан, ёмон хулқдан, молим, аҳлим ва фарзандимга қайтганда хунук ҳолатга дучор бўлишдан паноҳ сўрайман. Аллоҳим! Қабр фитнасидан, ҳаёт ва мамот фитнасидан ҳамда дунёю охират хорликларидан паноҳ сўрайман"
      },
      "ru": {
        "title": "Круг 3",
        "instructions": "Третий и последний круг рамаля. В начале поприветствуйте Чёрный камень, затем сохраняйте быстрый шаг. После этого круга быстрая ходьба заканчивается, дальше идёте обычно.",
        "note": "Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа.",
        "dua_transliteration": "Аллохумма! Инний аъуузу бика минаш-шакки ваш-ширки ван-нифааки ва сууил-ахлоки ва сууил-манзори вал-мунколиби фил-маали вал-ахли вал-валад. Аллохумма! Инний аъуузу бика мин фитнатил-кобри ва аъуузу бика мин фитнатил-махйаа вал-мамаати ва аъуузу бика минал хизйи фид-дунйаа вал-аахиро",
        "dua_translation": "О Аллах, прибегаю к Твоей защите от сомнения, от многобожия, от противления Твоему велению, от лицемерия, от дурного нрава и от печального зрелища по возвращении к моему имуществу, семье и детям. О Аллах, прибегаю к Твоей защите от испытания могилы, от испытаний жизни и смерти и от позора в этом мире и в вечной жизни."
      }
    },
    "duas": [
      {
        "dua_arabic": "اللهم إنِّي أَعُوذُ بِكَ مِنْ الشَّكِّ وَالشِّرْكِ وَالنِّفَاقِ وَالشِّقَاقِ وَسُوءِ الْأَخْلَاقِ وَسُوءِ المنظَرِ والْمُنْقَلَبِ فِي الْمَالِ وَالْأَهْلِ وَالْوَلَدِ اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ فِتْنَةِ الْقَبْرِ وَأَعُوذ بك من فتْنَة الْمحيا وَالْمَمَات وَأَعُوذُ بِك مِنْ الْخِزْيِ فِي الدُّنْيَا وَالْآخِرَةِ.",
        "translations": {
          "en": {
            "title": "Du‘a of circuit 3",
            "transliteration": "Allāhumma innī aʿūdhu bika mina-sh-shakki wa-sh-shirki wa-n-nifāqi wa-sh-shiqāqi wa sūʾi-l-akhlāq, wa sūʾi-l-manẓari wal-munqalabi fi-l-māli wal-ahli wal-walad. Allāhumma innī aʿūdhu bika min fitnati-l-qabr, wa aʿūdhu bika min fitnati-l-maḥyā wal-mamāt, wa aʿūdhu bika mina-l-khizyi fi-d-dunyā wal-ākhirah.",
            "translation": "O Allah, I seek refuge in You from doubt, from associating partners with You, from opposing Your command, from hypocrisy, from bad character, and from an evil sight when I return to my wealth, my family and my children. O Allah, I seek refuge in You from the trial of the grave, from the trials of life and death, and from disgrace in this world and the Hereafter.",
            "reference": null
          },
          "uz_latin": {
            "title": "3-aylanish duosi",
            "transliteration": "Allohumma! Inniy a’uuzu bika minash-shakki vash-shirki van-nifaaqi va suuil-axloqi va suuil-manzori val-munqolibi fil-maali val-ahli val-valad. Allohumma! Inniy a’uuzu bika min fitnatil-qobri va a’uuzu bika min fitnatil-mahyaa val-mamaati va a’uuzu bika minal xizyi fid-dunyaa val-aaxiro",
            "translation": "Allohim! Shakka tushishdan, shirkdan, amringga xilof qilishdan, munofiqlikdan, yomon xulqdan, molim, ahlim va farzandimga qaytganda xunuk holatga duchor bo‘lishdan panoh so‘rayman. Allohim! Qabr fitnasidan, hayot va mamot fitnasidan hamda dunyoyu oxirat xorliklaridan panoh so‘rayman",
            "reference": null
          },
          "uz_cyr": {
            "title": "3-айланиш дуоси",
            "transliteration": "Аллоҳумма! Инний аъуузу бика минаш-шакки ваш-ширки ван-нифаақи ва сууил-ахлоқи ва сууил-манзори вал-мунқолиби фил-маали вал-аҳли вал-валад. Аллоҳумма! Инний аъуузу бика мин фитнатил-қобри ва аъуузу бика мин фитнатил-маҳйаа вал-мамаати ва аъуузу бика минал хизйи фид-дунйаа вал-аахиро",
            "translation": "Аллоҳим! Шакка тушишдан, ширкдан, амрингга хилоф қилишдан, мунофиқликдан, ёмон хулқдан, молим, аҳлим ва фарзандимга қайтганда хунук ҳолатга дучор бўлишдан паноҳ сўрайман. Аллоҳим! Қабр фитнасидан, ҳаёт ва мамот фитнасидан ҳамда дунёю охират хорликларидан паноҳ сўрайман",
            "reference": null
          },
          "ru": {
            "title": "Дуа 3-го круга",
            "transliteration": "Аллохумма! Инний аъуузу бика минаш-шакки ваш-ширки ван-нифааки ва сууил-ахлоки ва сууил-манзори вал-мунколиби фил-маали вал-ахли вал-валад. Аллохумма! Инний аъуузу бика мин фитнатил-кобри ва аъуузу бика мин фитнатил-махйаа вал-мамаати ва аъуузу бика минал хизйи фид-дунйаа вал-аахиро",
            "translation": "О Аллах, прибегаю к Твоей защите от сомнения, от многобожия, от противления Твоему велению, от лицемерия, от дурного нрава и от печального зрелища по возвращении к моему имуществу, семье и детям. О Аллах, прибегаю к Твоей защите от испытания могилы, от испытаний жизни и смерти и от позора в этом мире и в вечной жизни.",
            "reference": null
          }
        }
      },
      {
        "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَفِي الْآخِرَةِ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وأدخلنا الجنة مع الأبرار يا عزيز يا غفار يا رب العالمين.",
        "translations": {
          "en": {
            "title": "Between the Yemeni Corner and the Black Stone",
            "transliteration": "Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.",
            "translation": "O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!",
            "reference": null
          },
          "uz_latin": {
            "title": "Rukni Yamoniy bilan Hajarul Asvad orasida",
            "transliteration": "Allohumma! Inniy as’alukal ’afva val-ofiyata fid-dunyaa va fil-aaxiro. Robbanaa! Aatinaa fid-dunyaa hasanatan va fil-aaxiroti hasanatan va qinaa ’azaban-naar. Vadxilnal-jannata ma’al abror, yaa ’aziyz, yaa G‘offar, yaa Robbal ’aalamiyn",
            "translation": "Allohim! Sendan dunyoyu oxiratda afv va ofiyat so‘rayman. Ey Robbimiz! Bizlarga dunyoda ham, oxiratda ham yaxshilik ato qilib, bizlarni do‘zax azobidan saqlagin. Bizlarni abror bandalaring bilan jannatga kirgizgin, ey Aziz, ey G‘affor, ey olamlar Robbi!",
            "reference": null
          },
          "uz_cyr": {
            "title": "Рукни Ямоний билан Ҳажарул Асвад орасида",
            "transliteration": "Аллоҳумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа ҳасанатан ва фил-аахироти ҳасанатан ва қинаа ъазабан-наар. Вадхилнал-жанната маъал аброр, йаа Ъазийз, йаа Ғоффар, йаа Роббал ъааламийн",
            "translation": "Аллоҳим! Сендан дунёю охиратда афв ва офият сўрайман. Эй Роббимиз! Бизларга дунёда ҳам, охиратда ҳам яхшилик ато қилиб, бизларни дўзах азобидан сақлагин. Бизларни аброр бандаларинг билан жаннатга киргизгин, эй Азиз, эй Ғаффор, эй оламлар Робби!",
            "reference": null
          },
          "ru": {
            "title": "Между Йеменским углом и Чёрным камнем",
            "transliteration": "Аллохумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа хасанатан ва фил-аахироти хасанатан ва кинаа ъазабан-наар. Вадхилнал-жанната маъал аброр, йаа Ъазийз, йаа Гоффар, йаа Роббал ъааламийн",
            "translation": "О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!",
            "reference": null
          }
        }
      }
    ]
  },
  {
    "sort_order": 4,
    "dua_arabic": "اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْيًا مَشْكُورًا وَذَنْبًا مَغْفُورًا وَعَمَلاً صالِحاً مَقبُولاً وَتِجارَةً لَن تَبورَ يا عَالِم ما في الصُدورِ أخرِجنِي يا اللهُ مِن الظُلُماتِ الى النورِ. اللَّهُمَّ إِنِّي أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ، وَعَزَائِمَ مَغْفِرَتِكَ، وَالْغَنِيمةَ مِنْ كُلِّ بِرِّ، وَالسَّلاَمةَ مِنْ كُلِّ إِثْمٍ وَالفَوْزَ بالجَنَّةِ، وَالنَّجاةَ مِنَ النَّارِ رَبِّ قَنِّعْنِي بِمَا رَزَقْتَنِي، وَبَارِكْ لِي فِيما أعطيتني وَاخْلُفْ عَلَى كُلِّ غَائِبَةٍ لِي مِنكَ بِخَيْرٍ.",
    "translations": {
      "en": {
        "title": "Circuit 4",
        "instructions": "From now walk at your normal, calm pace. Begin at the Black Stone with “Allāhu Akbar” and make du‘a freely in any language.",
        "note": "Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited.",
        "dua_transliteration": "Allāhumma-jʿalhu ḥajjan mabrūran, wa saʿyan mashkūran, wa dhanban maghfūran, wa ʿamalan ṣāliḥan maqbūlan, wa tijāratan lan tabūr. Yā ʿālima mā fi-ṣ-ṣudūr, akhrijnī yā Allāhu mina-ẓ-ẓulumāti ila-n-nūr. Allāhumma innī asʾaluka mūjibāti raḥmatik, wa ʿazāʾima maghfiratik, wal-ghanīmata min kulli birr, wa-s-salāmata min kulli ithm, wal-fawza bil-jannati wan-najāta mina-n-nār. Rabbi qanniʿnī bimā razaqtanī, wa bārik lī fīmā aʿṭaytanī, wakhluf ʿalā kulli ghāʾibatin lī minka bi-khayr.",
        "dua_translation": "O Allah, make this an accepted Hajj, my striving rewarded and my sins forgiven; make my deeds righteous and accepted, a trade that never fails. O Knower of what is in the hearts! O Allah, bring me out of the darkness into the light. O Allah, I ask You for what makes Your mercy due and what brings Your forgiveness, for safety from every sin, a share of every good, attaining Paradise and salvation from the Fire. My Lord, make me content with what You have provided me and bless me in what You have given me. Be the Guardian of everything of mine that is absent from me."
      },
      "uz_latin": {
        "title": "4-aylanish",
        "instructions": "Endi oddiy, xotirjam qadamda yuring. Qora Toshdan “Allohu Akbar” bilan boshlang va istalgan tilda erkin duo qiling.",
        "note": "Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi.",
        "dua_transliteration": "Allohumm! Ij’alhu hajjan mabruuron, va sa’yan mashkuuron, va zanban mag‘fuuron, va ’amalan solihan, maqbuulan va tijarotan lan tabuur. Yaa ’aalimu maa fis-suduur! Axrijniy yaa Allohu minaz-zulumaati ilan-nuur. Allohumma! Inniy as’aluka muujibaati rohmatika, va ’azaaima mag‘firotika, val g‘oniymata min kulli birr, va salaamata min kulli ism, val-favza bil jannati van-najaata minan naar. Robbi! Qanni’niy bimaa rozaqtaniy va baarik liy fiy maa a’tiniy vaxluf ’alaa kulli g‘oibatin liy minka bixoyrin",
        "dua_translation": "Allohim! Bu hajimni hajji mabrur qilgin. Harakatimni manfaatli qilgin. Gunohlarimni mag‘firat qilgin. Amallarimni solih va maqbul qilgin. Kasodga uchramaydigan tijorat qilgin. Ey dillardagi narsalarni bilguvchi Zot! Allohim! Meni zulmatdan nurga chiqargin. Allohim! Sendan rahmating vojib bo‘lishini, mag‘firatingga sabab bo‘lishini, har bir gunohdan salomatlikni, har bir yaxshilikdan bir o‘ljani, jannatga erishib, do‘zaxdan najot topishni so‘rayman. Robbim! Meni bergan rizqingga qanoat qilguvchi qilgin va menga bergan narsangda baraka bergin. Mendan g‘oibdagi barcha narsaga O‘zing hifzu himoyachi bo‘lgin"
      },
      "uz_cyr": {
        "title": "4-айланиш",
        "instructions": "Энди оддий, хотиржам қадамда юринг. Қора Тошдан “Аллоҳу Акбар” билан бошланг ва исталган тилда эркин дуо қилинг.",
        "note": "Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади.",
        "dua_transliteration": "Аллоҳумм! Ижъалҳу ҳажжан мабруурон, ва саъйан машкуурон, ва занбан мағфуурон, ва ъамалан солиҳан, мақбуулан ва тижаротан лан табуур. Йаа Ъаалиму маа фис-судуур! Ахрижний йаа Аллоҳу миназ-зулумаати илан-нуур. Аллоҳумма! Инний асъалука муужибаати роҳматика, ва ъазааима мағфиротика, вал ғониймата мин кулли бирр, ва салаамата мин кулли исм, вал-фавза бил жаннати ван-нажаата минан наар. Робби! Қанниъний бимаа розақтаний ва баарик лий фий маа аътиний вахлуф ъалаа кулли ғоибатин лий минка бихойрин",
        "dua_translation": "Аллоҳим! Бу ҳажимни ҳажжи мабрур қилгин. Ҳаракатимни манфаатли қилгин. Гуноҳларимни мағфират қилгин. Амалларимни солиҳ ва мақбул қилгин. Касодга учрамайдиган тижорат қилгин. Эй диллардаги нарсаларни билгувчи Зот! Аллоҳим! Мени зулматдан нурга чиқаргин. Аллоҳим! Сендан раҳматинг вожиб бўлишини, мағфиратингга сабаб бўлишини, ҳар бир гуноҳдан саломатликни, ҳар бир яхшиликдан бир ўлжани, жаннатга эришиб, дўзахдан нажот топишни сўрайман. Роббим! Мени берган ризқингга қаноат қилгувчи қилгин ва менга берган нарсангда барака бергин. Мендан ғоибдаги барча нарсага Ўзинг ҳифзу ҳимоячи бўлгин"
      },
      "ru": {
        "title": "Круг 4",
        "instructions": "Теперь идите обычным, спокойным шагом. Начните у Чёрного камня со слов «Аллаху Акбар» и свободно обращайтесь с дуа на любом языке.",
        "note": "Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа.",
        "dua_transliteration": "Аллохумм! Ижъалху хажжан мабруурон, ва саъйан машкуурон, ва занбан магфуурон, ва ъамалан солихан, макбуулан ва тижаротан лан табуур. Йаа Ъаалиму маа фис-судуур! Ахрижний йаа Аллоху миназ-зулумаати илан-нуур. Аллохумма! Инний асъалука муужибаати рохматика, ва ъазааима магфиротика, вал гониймата мин кулли бирр, ва салаамата мин кулли исм, вал-фавза бил жаннати ван-нажаата минан наар. Робби! Канниъний бимаа розактаний ва баарик лий фий маа аътиний вахлуф ъалаа кулли гоибатин лий минка бихойрин",
        "dua_translation": "О Аллах, сделай этот хадж принятым, мои усилия — вознаграждёнными, мои грехи — прощёнными, мои дела — праведными и принятыми, торговлей, которая не знает убытка. О Знающий то, что в сердцах! О Аллах, выведи меня из мрака к свету. О Аллах, прошу у Тебя того, что делает Твою милость обязательной и ведёт к Твоему прощению, избавления от всякого греха, доли во всяком благе, обретения Рая и спасения от Огня. Господи, сделай меня довольным тем, чем Ты наделил меня, и благослови меня в том, что Ты дал мне. Будь Хранителем всего моего, что вдали от меня."
      }
    },
    "duas": [
      {
        "dua_arabic": "اللَّهُمَّ اجْعَلْهُ حَجًّا مَبْرُورًا وَسَعْيًا مَشْكُورًا وَذَنْبًا مَغْفُورًا وَعَمَلاً صالِحاً مَقبُولاً وَتِجارَةً لَن تَبورَ يا عَالِم ما في الصُدورِ أخرِجنِي يا اللهُ مِن الظُلُماتِ الى النورِ. اللَّهُمَّ إِنِّي أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ، وَعَزَائِمَ مَغْفِرَتِكَ، وَالْغَنِيمةَ مِنْ كُلِّ بِرِّ، وَالسَّلاَمةَ مِنْ كُلِّ إِثْمٍ وَالفَوْزَ بالجَنَّةِ، وَالنَّجاةَ مِنَ النَّارِ رَبِّ قَنِّعْنِي بِمَا رَزَقْتَنِي، وَبَارِكْ لِي فِيما أعطيتني وَاخْلُفْ عَلَى كُلِّ غَائِبَةٍ لِي مِنكَ بِخَيْرٍ.",
        "translations": {
          "en": {
            "title": "Du‘a of circuit 4",
            "transliteration": "Allāhumma-jʿalhu ḥajjan mabrūran, wa saʿyan mashkūran, wa dhanban maghfūran, wa ʿamalan ṣāliḥan maqbūlan, wa tijāratan lan tabūr. Yā ʿālima mā fi-ṣ-ṣudūr, akhrijnī yā Allāhu mina-ẓ-ẓulumāti ila-n-nūr. Allāhumma innī asʾaluka mūjibāti raḥmatik, wa ʿazāʾima maghfiratik, wal-ghanīmata min kulli birr, wa-s-salāmata min kulli ithm, wal-fawza bil-jannati wan-najāta mina-n-nār. Rabbi qanniʿnī bimā razaqtanī, wa bārik lī fīmā aʿṭaytanī, wakhluf ʿalā kulli ghāʾibatin lī minka bi-khayr.",
            "translation": "O Allah, make this an accepted Hajj, my striving rewarded and my sins forgiven; make my deeds righteous and accepted, a trade that never fails. O Knower of what is in the hearts! O Allah, bring me out of the darkness into the light. O Allah, I ask You for what makes Your mercy due and what brings Your forgiveness, for safety from every sin, a share of every good, attaining Paradise and salvation from the Fire. My Lord, make me content with what You have provided me and bless me in what You have given me. Be the Guardian of everything of mine that is absent from me.",
            "reference": "Kitab al-Manasik"
          },
          "uz_latin": {
            "title": "4-aylanish duosi",
            "transliteration": "Allohumm! Ij’alhu hajjan mabruuron, va sa’yan mashkuuron, va zanban mag‘fuuron, va ’amalan solihan, maqbuulan va tijarotan lan tabuur. Yaa ’aalimu maa fis-suduur! Axrijniy yaa Allohu minaz-zulumaati ilan-nuur. Allohumma! Inniy as’aluka muujibaati rohmatika, va ’azaaima mag‘firotika, val g‘oniymata min kulli birr, va salaamata min kulli ism, val-favza bil jannati van-najaata minan naar. Robbi! Qanni’niy bimaa rozaqtaniy va baarik liy fiy maa a’tiniy vaxluf ’alaa kulli g‘oibatin liy minka bixoyrin",
            "translation": "Allohim! Bu hajimni hajji mabrur qilgin. Harakatimni manfaatli qilgin. Gunohlarimni mag‘firat qilgin. Amallarimni solih va maqbul qilgin. Kasodga uchramaydigan tijorat qilgin. Ey dillardagi narsalarni bilguvchi Zot! Allohim! Meni zulmatdan nurga chiqargin. Allohim! Sendan rahmating vojib bo‘lishini, mag‘firatingga sabab bo‘lishini, har bir gunohdan salomatlikni, har bir yaxshilikdan bir o‘ljani, jannatga erishib, do‘zaxdan najot topishni so‘rayman. Robbim! Meni bergan rizqingga qanoat qilguvchi qilgin va menga bergan narsangda baraka bergin. Mendan g‘oibdagi barcha narsaga O‘zing hifzu himoyachi bo‘lgin",
            "reference": "Kitabi manaasik"
          },
          "uz_cyr": {
            "title": "4-айланиш дуоси",
            "transliteration": "Аллоҳумм! Ижъалҳу ҳажжан мабруурон, ва саъйан машкуурон, ва занбан мағфуурон, ва ъамалан солиҳан, мақбуулан ва тижаротан лан табуур. Йаа Ъаалиму маа фис-судуур! Ахрижний йаа Аллоҳу миназ-зулумаати илан-нуур. Аллоҳумма! Инний асъалука муужибаати роҳматика, ва ъазааима мағфиротика, вал ғониймата мин кулли бирр, ва салаамата мин кулли исм, вал-фавза бил жаннати ван-нажаата минан наар. Робби! Қанниъний бимаа розақтаний ва баарик лий фий маа аътиний вахлуф ъалаа кулли ғоибатин лий минка бихойрин",
            "translation": "Аллоҳим! Бу ҳажимни ҳажжи мабрур қилгин. Ҳаракатимни манфаатли қилгин. Гуноҳларимни мағфират қилгин. Амалларимни солиҳ ва мақбул қилгин. Касодга учрамайдиган тижорат қилгин. Эй диллардаги нарсаларни билгувчи Зот! Аллоҳим! Мени зулматдан нурга чиқаргин. Аллоҳим! Сендан раҳматинг вожиб бўлишини, мағфиратингга сабаб бўлишини, ҳар бир гуноҳдан саломатликни, ҳар бир яхшиликдан бир ўлжани, жаннатга эришиб, дўзахдан нажот топишни сўрайман. Роббим! Мени берган ризқингга қаноат қилгувчи қилгин ва менга берган нарсангда барака бергин. Мендан ғоибдаги барча нарсага Ўзинг ҳифзу ҳимоячи бўлгин",
            "reference": "Китаби манаасик"
          },
          "ru": {
            "title": "Дуа 4-го круга",
            "transliteration": "Аллохумм! Ижъалху хажжан мабруурон, ва саъйан машкуурон, ва занбан магфуурон, ва ъамалан солихан, макбуулан ва тижаротан лан табуур. Йаа Ъаалиму маа фис-судуур! Ахрижний йаа Аллоху миназ-зулумаати илан-нуур. Аллохумма! Инний асъалука муужибаати рохматика, ва ъазааима магфиротика, вал гониймата мин кулли бирр, ва салаамата мин кулли исм, вал-фавза бил жаннати ван-нажаата минан наар. Робби! Канниъний бимаа розактаний ва баарик лий фий маа аътиний вахлуф ъалаа кулли гоибатин лий минка бихойрин",
            "translation": "О Аллах, сделай этот хадж принятым, мои усилия — вознаграждёнными, мои грехи — прощёнными, мои дела — праведными и принятыми, торговлей, которая не знает убытка. О Знающий то, что в сердцах! О Аллах, выведи меня из мрака к свету. О Аллах, прошу у Тебя того, что делает Твою милость обязательной и ведёт к Твоему прощению, избавления от всякого греха, доли во всяком благе, обретения Рая и спасения от Огня. Господи, сделай меня довольным тем, чем Ты наделил меня, и благослови меня в том, что Ты дал мне. Будь Хранителем всего моего, что вдали от меня.",
            "reference": "Китаб аль-Манасик"
          }
        }
      },
      {
        "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَفِي الْآخِرَةِ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وأدخلنا الجنة مع الأبرار يا عزيز يا غفار يا رب العالمين.",
        "translations": {
          "en": {
            "title": "Between the Yemeni Corner and the Black Stone",
            "transliteration": "Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.",
            "translation": "O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!",
            "reference": null
          },
          "uz_latin": {
            "title": "Rukni Yamoniy bilan Hajarul Asvad orasida",
            "transliteration": "Allohumma! Inniy as’alukal ’afva val-ofiyata fid-dunyaa va fil-aaxiro. Robbanaa! Aatinaa fid-dunyaa hasanatan va fil-aaxiroti hasanatan va qinaa ’azaban-naar. Vadxilnal jannata ma’al abror, yaa ’aziyz, yaa G‘offar, yaa Robbal ’aalamiyn",
            "translation": "Allohim! Sendan dunyoyu oxiratda afv va ofiyat so‘rayman. Robbimiz! Bizlarga dunyoda ham, oxiratda ham yaxshilik ato qilib, bizlarni do‘zax azobidan saqlagin. Bizlarni abror bandalaring bilan jannatga kirgizgin, ey Aziz, ey G‘affor, ey olamlar Robbi!",
            "reference": null
          },
          "uz_cyr": {
            "title": "Рукни Ямоний билан Ҳажарул Асвад орасида",
            "transliteration": "Аллоҳумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа ҳасанатан ва фил-аахироти ҳасанатан ва қинаа ъазабан-наар. Вадхилнал жанната маъал аброр, йаа Ъазийз, йаа Ғоффар, йаа Роббал ъааламийн",
            "translation": "Аллоҳим! Сендан дунёю охиратда афв ва офият сўрайман. Роббимиз! Бизларга дунёда ҳам, охиратда ҳам яхшилик ато қилиб, бизларни дўзах азобидан сақлагин. Бизларни аброр бандаларинг билан жаннатга киргизгин, эй Азиз, эй Ғаффор, эй оламлар Робби!",
            "reference": null
          },
          "ru": {
            "title": "Между Йеменским углом и Чёрным камнем",
            "transliteration": "Аллохумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа хасанатан ва фил-аахироти хасанатан ва кинаа ъазабан-наар. Вадхилнал жанната маъал аброр, йаа Ъазийз, йаа Гоффар, йаа Роббал ъааламийн",
            "translation": "О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!",
            "reference": null
          }
        }
      }
    ]
  },
  {
    "sort_order": 5,
    "dua_arabic": "اللَّهُمَّ أَظِلَّنِي تَحْتَ ظِلِّ عَرْشِك يَوْمَ لَا ظِلَّ إلَّا ظِلُّ عَرْشِك ولا باقي إلا وجهك واسقني من حوض نبيك سيدنا محمد صلّى الله عليه وسلم شربة هنيئة مريئة لا نظمأ بعدها أبداً اللَّهُمَّ إِنَّي أسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ مِنْهُ نَبِيُّكَ سَيِّدُنا مُحَمَّدٌ صلّى الله عليه وسلم وَأعُوذُ بِكَ مِنْ شَرِّ مَا اسْتَعَاذَ بِكَ مِنْهُ نَبِيُّكَ سَيِّدُنا مُحَمَّدٌ صلّى الله عليه وسلم وَأَنْتَ الْمُسْتَعَانُ وَعَلَيْكَ الْبَلاَغُ وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ. اللَّهُمَّ إِنِّى أَسْأَلُكَ الْجَنَّةَ وَنَعِيمَهَا وَمَا يُقَرِّبُنِي إلَيها مِن قَولٍ أو فِعلٍ أو عَملٍ وَأعُوذُ بِكَ مِن النَّارِ وَمَا يُقَرِّبُنِي إلِيها مِن قَولٍ أو فِعلٍ أو عَمَلٍ.",
    "translations": {
      "en": {
        "title": "Circuit 5",
        "instructions": "Fifth round at a calm pace. Salute the Black Stone and continue, keeping the Kaaba on your left and your heart focused on remembrance.",
        "note": "Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited.",
        "dua_transliteration": "Allāhumma aẓillanī taḥta ẓilli ʿarshika yawma lā ẓilla illā ẓillu ʿarshik, wa lā bāqiya illā wajhuk, wasqinī min ḥawḍi nabiyyika sayyidinā Muḥammadin ṣalla-llāhu ʿalayhi wa sallam sharbatan hanīʾatan marīʾatan lā naẓmaʾu baʿdahā abadā. Allāhumma innī asʾaluka min khayri mā saʾalaka minhu nabiyyuka sayyidunā Muḥammadun ṣalla-llāhu ʿalayhi wa sallam, wa aʿūdhu bika min sharri ma-staʿādha bika minhu nabiyyuka sayyidunā Muḥammadun ṣalla-llāhu ʿalayhi wa sallam, wa anta-l-mustaʿānu wa ʿalayka-l-balāgh, wa lā ḥawla wa lā quwwata illā billāh. Allāhumma innī asʾaluka-l-jannata wa naʿīmahā wa mā yuqarribunī ilayhā min qawlin aw fiʿlin aw ʿamal, wa aʿūdhu bika mina-n-nāri wa mā yuqarribunī ilayhā min qawlin aw fiʿlin aw ʿamal.",
        "dua_translation": "O Allah, shade me in the shade of Your Throne on the Day when there is no shade but the shade of Your Throne. None remains but You. Let me drink from the Pond (Kawthar) of Your Prophet, our master Muhammad ﷺ, a drink after which I will never thirst again. O Allah, I ask You for all the good that Your Prophet, our master Muhammad ﷺ, asked You for, and I seek refuge in You from the evil of everything from which Your Prophet, our master Muhammad ﷺ, sought refuge. You alone are the One whose help is sought and who suffices. There is no power to obey and no strength to keep away from sin except through Allah. O Allah, I ask You for Paradise and its delights, and for the words, acts and deeds that bring me near to it; and I seek refuge in You from the Fire and from the words, acts and deeds that bring me near to it."
      },
      "uz_latin": {
        "title": "5-aylanish",
        "instructions": "Beshinchi aylanish, xotirjam qadamda. Qora Toshga istilom qilib davom eting, Ka‘bani chap tomoningizda qoldirib, qalbingizni zikrga jalb qiling.",
        "note": "Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi.",
        "dua_transliteration": "Allohumma! Azillaniy tahta zilli ’arshika yavma laa zilla illa zillu ’arshik. Va laa baaqiya illa vajhak vasqiniy min havdi Nabiyyika sayyidinaa Muhammadin sollallohu alayhi vasallam shurbatan hani’atan mari’atan laa nazmau ba’dahaa abada! Allohumma! Inniy as’aluka min xoyri maa saalaka minhu Nabiyyuka sayyiduna Muhammadun sollallohu alayhi vasallama va a’uuzu bika min sharri maa ista’aaza bika minhu Nabiyyuka sayyiduna Muhammadun sollallohu alayhi vasallama va antal musta’aanu va alaykal balaag‘u va laa havla va laa quvvata illaa billaah. Allohumma! Inniy as’alukal jannata va na’iymahaa va maa yuqorribuniy ilayhaa min qovlin av fi’lin av amalin va a’uuzu bika minan-naari va maa yuqorribuniy ilayhaa min qovlin av fi’lin av amalin",
        "dua_translation": "Allohim! Arshing soyasidan o‘zga soya yo‘q kunda meni arshing soyasida qilgin. O‘zingdan o‘zga boqiy qolguvchi yo‘qdir. Meni Nabiyying, sayyidimiz Muhammad sollallohu alayhi vasallamning havzi kavsaridan bahralantirib, qaytib chanqamaydigan qilib ichirgin. Allohim, men Nabiyying, sayyidimiz Muhammad sollallohu alayhi vasallam so‘ragan barcha yaxshiliklarni so‘rayman. Nabiyying, sayyidimiz Muhammad sollallohu alayhi vasallam panoh so‘ragan narsalarning barchasining yomonligidan panoh so‘rayman. Madad so‘raladigan ham, kifoya qilguvchi ham faqat O‘zingsan. Toatga ham, ma’siyatdan saqlanishga ham qudrat yolg‘iz Alloh taolo tomonidandir. Allohim! Sendan jannat va uning ne’matlarini hamda unga yaqin qiluvchi so‘z, fe’l va amalni so‘rayman. Do‘zaxdan va do‘zaxga yaqin qilguvchi so‘z, fe’l va amaldan panoh so‘rayman"
      },
      "uz_cyr": {
        "title": "5-айланиш",
        "instructions": "Бешинчи айланиш, хотиржам қадамда. Қора Тошга истилом қилиб давом этинг, Каъбани чап томонингизда қолдириб, қалбингизни зикрга жалб қилинг.",
        "note": "Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади.",
        "dua_transliteration": "Аллоҳумма! Азилланий таҳта зилли ъаршика йавма лаа зилла илла зиллу ъаршик. Ва лаа баақия илла важҳак васқиний мин ҳавди Набиййика саййидинаа Муҳаммадин соллаллоҳу алайҳи васаллам шурбатан ҳаниъатан мариъатан лаа назмау баъдаҳаа абада! Аллоҳумма! Инний асъалука мин хойри маа саалака минҳу Набийюка саййидуна Муҳаммадун соллаллоҳу алайҳи васаллама ва аъуузу бика мин шарри маа истаъааза бика минҳу Набийюка саййидуна Муҳаммадун соллаллоҳу алайҳи васаллама ва антал мустаъаану ва алайкал балаағу ва лаа ҳавла ва лаа қуввата иллаа биллааҳ. Аллоҳумма! Инний асъалукал жанната ва наъиймаҳаа ва маа йуқоррибуний илайҳаа мин қовлин ав фиълин ав амалин ва аъуузу бика минан-наари ва маа йуқоррибуний илайҳаа мин қовлин ав фиълин ав амалин",
        "dua_translation": "Аллоҳим! Аршинг соясидан ўзга соя йўқ кунда мени аршинг соясида қилгин. Ўзингдан ўзга боқий қолгувчи йўқдир. Мени Набиййинг, саййидимиз Муҳаммад соллаллоҳу алайҳи васалламнинг ҳавзи кавсаридан баҳралантириб, қайтиб чанқамайдиган қилиб ичиргин. Аллоҳим, мен Набиййинг, саййидимиз Муҳаммад соллаллоҳу алайҳи васаллам сўраган барча яхшиликларни сўрайман. Набиййинг, саййидимиз Муҳаммад соллаллоҳу алайҳи васаллам паноҳ сўраган нарсаларнинг барчасининг ёмонлигидан паноҳ сўрайман. Мадад сўраладиган ҳам, кифоя қилгувчи ҳам фақат Ўзингсан. Тоатга ҳам, маъсиятдан сақланишга ҳам қудрат ёлғиз Аллоҳ таоло томонидандир. Аллоҳим! Сендан жаннат ва унинг неъматларини ҳамда унга яқин қилувчи сўз, феъл ва амални сўрайман. Дўзахдан ва дўзахга яқин қилгувчи сўз, феъл ва амалдан паноҳ сўрайман"
      },
      "ru": {
        "title": "Круг 5",
        "instructions": "Пятый круг в спокойном темпе. Поприветствуйте Чёрный камень и продолжайте, держа Каабу слева, а сердце — в поминании Аллаха.",
        "note": "Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа.",
        "dua_transliteration": "Аллохумма! Азилланий тахта зилли ъаршика йавма лаа зилла илла зиллу ъаршик. Ва лаа баакия илла важхак васкиний мин хавди Набиййика саййидинаа Мухаммадин соллаллоху алайхи васаллам шурбатан ханиъатан мариъатан лаа назмау баъдахаа абада! Аллохумма! Инний асъалука мин хойри маа саалака минху Набийюка саййидуна Мухаммадун соллаллоху алайхи васаллама ва аъуузу бика мин шарри маа истаъааза бика минху Набийюка саййидуна Мухаммадун соллаллоху алайхи васаллама ва антал мустаъаану ва алайкал балаагу ва лаа хавла ва лаа куввата иллаа биллаах. Аллохумма! Инний асъалукал жанната ва наъиймахаа ва маа йукоррибуний илайхаа мин ковлин ав фиълин ав амалин ва аъуузу бика минан-наари ва маа йукоррибуний илайхаа мин ковлин ав фиълин ав амалин",
        "dua_translation": "О Аллах, укрой меня в тени Твоего Трона в День, когда не будет тени, кроме тени Твоего Трона. Вечен лишь Ты. Напои меня из водоёма (Каусар) Твоего Пророка, нашего господина Мухаммада ﷺ, так, чтобы я больше никогда не испытал жажды. О Аллах, прошу у Тебя всего блага, о котором просил Тебя Твой Пророк, наш господин Мухаммад ﷺ, и прибегаю к Твоей защите от зла всего, от чего искал защиты Твой Пророк, наш господин Мухаммад ﷺ. Лишь у Тебя просят помощи, и лишь Ты достаточен. Сила к покорности и сила удержаться от греха — только от Аллаха. О Аллах, прошу у Тебя Рая и его благ и слов, поступков и дел, приближающих к нему, и прибегаю к Твоей защите от Огня и от слов, поступков и дел, приближающих к нему."
      }
    },
    "duas": [
      {
        "dua_arabic": "اللَّهُمَّ أَظِلَّنِي تَحْتَ ظِلِّ عَرْشِك يَوْمَ لَا ظِلَّ إلَّا ظِلُّ عَرْشِك ولا باقي إلا وجهك واسقني من حوض نبيك سيدنا محمد صلّى الله عليه وسلم شربة هنيئة مريئة لا نظمأ بعدها أبداً اللَّهُمَّ إِنَّي أسْأَلُكَ مِنْ خَيْرِ مَا سَأَلَكَ مِنْهُ نَبِيُّكَ سَيِّدُنا مُحَمَّدٌ صلّى الله عليه وسلم وَأعُوذُ بِكَ مِنْ شَرِّ مَا اسْتَعَاذَ بِكَ مِنْهُ نَبِيُّكَ سَيِّدُنا مُحَمَّدٌ صلّى الله عليه وسلم وَأَنْتَ الْمُسْتَعَانُ وَعَلَيْكَ الْبَلاَغُ وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ. اللَّهُمَّ إِنِّى أَسْأَلُكَ الْجَنَّةَ وَنَعِيمَهَا وَمَا يُقَرِّبُنِي إلَيها مِن قَولٍ أو فِعلٍ أو عَملٍ وَأعُوذُ بِكَ مِن النَّارِ وَمَا يُقَرِّبُنِي إلِيها مِن قَولٍ أو فِعلٍ أو عَمَلٍ.",
        "translations": {
          "en": {
            "title": "Du‘a of circuit 5",
            "transliteration": "Allāhumma aẓillanī taḥta ẓilli ʿarshika yawma lā ẓilla illā ẓillu ʿarshik, wa lā bāqiya illā wajhuk, wasqinī min ḥawḍi nabiyyika sayyidinā Muḥammadin ṣalla-llāhu ʿalayhi wa sallam sharbatan hanīʾatan marīʾatan lā naẓmaʾu baʿdahā abadā. Allāhumma innī asʾaluka min khayri mā saʾalaka minhu nabiyyuka sayyidunā Muḥammadun ṣalla-llāhu ʿalayhi wa sallam, wa aʿūdhu bika min sharri ma-staʿādha bika minhu nabiyyuka sayyidunā Muḥammadun ṣalla-llāhu ʿalayhi wa sallam, wa anta-l-mustaʿānu wa ʿalayka-l-balāgh, wa lā ḥawla wa lā quwwata illā billāh. Allāhumma innī asʾaluka-l-jannata wa naʿīmahā wa mā yuqarribunī ilayhā min qawlin aw fiʿlin aw ʿamal, wa aʿūdhu bika mina-n-nāri wa mā yuqarribunī ilayhā min qawlin aw fiʿlin aw ʿamal.",
            "translation": "O Allah, shade me in the shade of Your Throne on the Day when there is no shade but the shade of Your Throne. None remains but You. Let me drink from the Pond (Kawthar) of Your Prophet, our master Muhammad ﷺ, a drink after which I will never thirst again. O Allah, I ask You for all the good that Your Prophet, our master Muhammad ﷺ, asked You for, and I seek refuge in You from the evil of everything from which Your Prophet, our master Muhammad ﷺ, sought refuge. You alone are the One whose help is sought and who suffices. There is no power to obey and no strength to keep away from sin except through Allah. O Allah, I ask You for Paradise and its delights, and for the words, acts and deeds that bring me near to it; and I seek refuge in You from the Fire and from the words, acts and deeds that bring me near to it.",
            "reference": null
          },
          "uz_latin": {
            "title": "5-aylanish duosi",
            "transliteration": "Allohumma! Azillaniy tahta zilli ’arshika yavma laa zilla illa zillu ’arshik. Va laa baaqiya illa vajhak vasqiniy min havdi Nabiyyika sayyidinaa Muhammadin sollallohu alayhi vasallam shurbatan hani’atan mari’atan laa nazmau ba’dahaa abada! Allohumma! Inniy as’aluka min xoyri maa saalaka minhu Nabiyyuka sayyiduna Muhammadun sollallohu alayhi vasallama va a’uuzu bika min sharri maa ista’aaza bika minhu Nabiyyuka sayyiduna Muhammadun sollallohu alayhi vasallama va antal musta’aanu va alaykal balaag‘u va laa havla va laa quvvata illaa billaah. Allohumma! Inniy as’alukal jannata va na’iymahaa va maa yuqorribuniy ilayhaa min qovlin av fi’lin av amalin va a’uuzu bika minan-naari va maa yuqorribuniy ilayhaa min qovlin av fi’lin av amalin",
            "translation": "Allohim! Arshing soyasidan o‘zga soya yo‘q kunda meni arshing soyasida qilgin. O‘zingdan o‘zga boqiy qolguvchi yo‘qdir. Meni Nabiyying, sayyidimiz Muhammad sollallohu alayhi vasallamning havzi kavsaridan bahralantirib, qaytib chanqamaydigan qilib ichirgin. Allohim, men Nabiyying, sayyidimiz Muhammad sollallohu alayhi vasallam so‘ragan barcha yaxshiliklarni so‘rayman. Nabiyying, sayyidimiz Muhammad sollallohu alayhi vasallam panoh so‘ragan narsalarning barchasining yomonligidan panoh so‘rayman. Madad so‘raladigan ham, kifoya qilguvchi ham faqat O‘zingsan. Toatga ham, ma’siyatdan saqlanishga ham qudrat yolg‘iz Alloh taolo tomonidandir. Allohim! Sendan jannat va uning ne’matlarini hamda unga yaqin qiluvchi so‘z, fe’l va amalni so‘rayman. Do‘zaxdan va do‘zaxga yaqin qilguvchi so‘z, fe’l va amaldan panoh so‘rayman",
            "reference": null
          },
          "uz_cyr": {
            "title": "5-айланиш дуоси",
            "transliteration": "Аллоҳумма! Азилланий таҳта зилли ъаршика йавма лаа зилла илла зиллу ъаршик. Ва лаа баақия илла важҳак васқиний мин ҳавди Набиййика саййидинаа Муҳаммадин соллаллоҳу алайҳи васаллам шурбатан ҳаниъатан мариъатан лаа назмау баъдаҳаа абада! Аллоҳумма! Инний асъалука мин хойри маа саалака минҳу Набийюка саййидуна Муҳаммадун соллаллоҳу алайҳи васаллама ва аъуузу бика мин шарри маа истаъааза бика минҳу Набийюка саййидуна Муҳаммадун соллаллоҳу алайҳи васаллама ва антал мустаъаану ва алайкал балаағу ва лаа ҳавла ва лаа қуввата иллаа биллааҳ. Аллоҳумма! Инний асъалукал жанната ва наъиймаҳаа ва маа йуқоррибуний илайҳаа мин қовлин ав фиълин ав амалин ва аъуузу бика минан-наари ва маа йуқоррибуний илайҳаа мин қовлин ав фиълин ав амалин",
            "translation": "Аллоҳим! Аршинг соясидан ўзга соя йўқ кунда мени аршинг соясида қилгин. Ўзингдан ўзга боқий қолгувчи йўқдир. Мени Набиййинг, саййидимиз Муҳаммад соллаллоҳу алайҳи васалламнинг ҳавзи кавсаридан баҳралантириб, қайтиб чанқамайдиган қилиб ичиргин. Аллоҳим, мен Набиййинг, саййидимиз Муҳаммад соллаллоҳу алайҳи васаллам сўраган барча яхшиликларни сўрайман. Набиййинг, саййидимиз Муҳаммад соллаллоҳу алайҳи васаллам паноҳ сўраган нарсаларнинг барчасининг ёмонлигидан паноҳ сўрайман. Мадад сўраладиган ҳам, кифоя қилгувчи ҳам фақат Ўзингсан. Тоатга ҳам, маъсиятдан сақланишга ҳам қудрат ёлғиз Аллоҳ таоло томонидандир. Аллоҳим! Сендан жаннат ва унинг неъматларини ҳамда унга яқин қилувчи сўз, феъл ва амални сўрайман. Дўзахдан ва дўзахга яқин қилгувчи сўз, феъл ва амалдан паноҳ сўрайман",
            "reference": null
          },
          "ru": {
            "title": "Дуа 5-го круга",
            "transliteration": "Аллохумма! Азилланий тахта зилли ъаршика йавма лаа зилла илла зиллу ъаршик. Ва лаа баакия илла важхак васкиний мин хавди Набиййика саййидинаа Мухаммадин соллаллоху алайхи васаллам шурбатан ханиъатан мариъатан лаа назмау баъдахаа абада! Аллохумма! Инний асъалука мин хойри маа саалака минху Набийюка саййидуна Мухаммадун соллаллоху алайхи васаллама ва аъуузу бика мин шарри маа истаъааза бика минху Набийюка саййидуна Мухаммадун соллаллоху алайхи васаллама ва антал мустаъаану ва алайкал балаагу ва лаа хавла ва лаа куввата иллаа биллаах. Аллохумма! Инний асъалукал жанната ва наъиймахаа ва маа йукоррибуний илайхаа мин ковлин ав фиълин ав амалин ва аъуузу бика минан-наари ва маа йукоррибуний илайхаа мин ковлин ав фиълин ав амалин",
            "translation": "О Аллах, укрой меня в тени Твоего Трона в День, когда не будет тени, кроме тени Твоего Трона. Вечен лишь Ты. Напои меня из водоёма (Каусар) Твоего Пророка, нашего господина Мухаммада ﷺ, так, чтобы я больше никогда не испытал жажды. О Аллах, прошу у Тебя всего блага, о котором просил Тебя Твой Пророк, наш господин Мухаммад ﷺ, и прибегаю к Твоей защите от зла всего, от чего искал защиты Твой Пророк, наш господин Мухаммад ﷺ. Лишь у Тебя просят помощи, и лишь Ты достаточен. Сила к покорности и сила удержаться от греха — только от Аллаха. О Аллах, прошу у Тебя Рая и его благ и слов, поступков и дел, приближающих к нему, и прибегаю к Твоей защите от Огня и от слов, поступков и дел, приближающих к нему.",
            "reference": null
          }
        }
      },
      {
        "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَفِي الْآخِرَةِ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وأدخلنا الجنة مع الأبرار يا عزيز يا غفار يا رب العالمين.",
        "translations": {
          "en": {
            "title": "Between the Yemeni Corner and the Black Stone",
            "transliteration": "Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.",
            "translation": "O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!",
            "reference": null
          },
          "uz_latin": {
            "title": "Rukni Yamoniy bilan Hajarul Asvad orasida",
            "transliteration": "Allohumma! Inniy as’alukal ’afva val-ofiyata fid-dunyaa va fil-aaxiro. Robbanaa aatinaa fid-dunyaa hasanatan vafil aaxiroti hasanatan va qinaa ’azaban naar. Va adxilnaal jannata m’al abror yaa ’aziyz yaa g‘offar yaa Robbal ’aalamiyn",
            "translation": "Allohim! Sendan dunyoyu oxiratda afv va ofiyat so‘rayman. Robbimiz! Bizlarga dunyoda ham, oxiratda ham yaxshilik ato qilib, bizlarni do‘zax azobidan saqlagin. Bizlarni abror bandalaring bilan jannatga kirgizgin, ey Aziz, ey G‘affor, ey olamlar Robbi!",
            "reference": null
          },
          "uz_cyr": {
            "title": "Рукни Ямоний билан Ҳажарул Асвад орасида",
            "transliteration": "Аллоҳумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа аатинаа фид-дунйаа ҳасанатан вафил аахироти ҳасанатан ва қинаа ъазабан наар. Ва адхилнаал жанната мъал аброр йаа ъазийз йаа ғоффар йаа Роббал ъааламийн",
            "translation": "Аллоҳим! Сендан дунёю охиратда афв ва офият сўрайман. Роббимиз! Бизларга дунёда ҳам, охиратда ҳам яхшилик ато қилиб, бизларни дўзах азобидан сақлагин. Бизларни аброр бандаларинг билан жаннатга киргизгин, эй Азиз, эй Ғаффор, эй оламлар Робби!",
            "reference": null
          },
          "ru": {
            "title": "Между Йеменским углом и Чёрным камнем",
            "transliteration": "Аллохумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа аатинаа фид-дунйаа хасанатан вафил аахироти хасанатан ва кинаа ъазабан наар. Ва адхилнаал жанната мъал аброр йаа ъазийз йаа гоффар йаа Роббал ъааламийн",
            "translation": "О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!",
            "reference": null
          }
        }
      }
    ]
  },
  {
    "sort_order": 6,
    "dua_arabic": "اللهم ان لك علي حقوقا كثيرة فيما بيني وبينك وحقوقا كثيرة فيما بيني وبين حلقك اللهم ما كان لك منها فاغفره لي وما كان لخلقك فتحمله عني واغنني بحلالك عن حرامك وبطاعتك عن معصيتك وبفضلك عمن سواك يا واسع المغفرة اللهم ان بيتك عظيم ووجهك كريم وانت يا الله حليم كريم عظيم تحب العفو فاعف عني.",
    "translations": {
      "en": {
        "title": "Circuit 6",
        "instructions": "Sixth round. Keep your heart present in du‘a. Touch the Yemeni Corner if it is easy, and salute the Black Stone at the start.",
        "note": "Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited.",
        "dua_transliteration": "Allāhumma inna laka ʿalayya ḥuqūqan kathīratan fīmā baynī wa baynak, wa ḥuqūqan kathīratan fīmā baynī wa bayna khalqik. Allāhumma mā kāna laka minhā faghfirhu lī, wa mā kāna li-khalqika fataḥammalhu ʿannī, wa aghninī bi-ḥalālika ʿan ḥarāmik, wa bi-ṭāʿatika ʿan maʿṣiyatik, wa bi-faḍlika ʿamman siwāk, yā wāsiʿa-l-maghfirah. Allāhumma inna baytaka ʿaẓīm, wa wajhaka karīm, wa anta yā Allāhu ḥalīmun karīmun ʿaẓīm, tuḥibbu-l-ʿafwa faʿfu ʿannī.",
        "dua_translation": "O Allah, You have many rights over me in what is between You and me, and there are many rights in what is between me and Your creation. O Allah, forgive me what of them is due to You, and take upon Yourself what is due to Your creation. By Your lawful make me free of need of Your unlawful, by obedience to You free of disobeying You, and by Your bounty free of anyone besides You, O You whose forgiveness is vast! O Allah, Your House is great and You are Noble. O Allah, You are Forbearing, Generous and Great. You love to pardon, so pardon me."
      },
      "uz_latin": {
        "title": "6-aylanish",
        "instructions": "Oltinchi aylanish. Qalbingizni duoda hozir tuting. Oson bo‘lsa Yamaniy burchakka qo‘l tegizing, boshida Qora Toshga istilom qiling.",
        "note": "Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi.",
        "dua_transliteration": "Allohumma! Inna laka alayya huquqan kasirotan fiy maa bayniy va baynaka, va huquqon kasiyrotan fiy maa bayniy va bayna holqik. Allohumma! Maa kaana laka minhaa fag‘firhu liy, va maa kaana lixolqika, fatahammilhu ’anniy vag‘niniy bihalaalika ’an rohmatika va bito’atika ’an ma’siyatik va bifadlika amman sivaak, yaa vaasi’al mag‘firoh! Allohumma! Inna baytika ’aziym, va vajhaka kariym. Va anta, yaa Alloh, halimun kariymun ’aziymun! Tuhibbul ’afva, fa’fu ’anniy",
        "dua_translation": "Allohim! Sen bilan mening oramda Sen uchun ulkan haqlar bor. Men bilan maxluqotlaring o‘rtasida ham ulkan haqlar bor. O‘sha haqlardan Sen uchun bo‘lganini mendan mag‘firat qilgin. Maxluqotlaring uchun bo‘lgan haqni kechirib yuborishni zimmangga olgin. Haloling bilan haromingdan, toating bilan Senga ma’siyat qilishdan, fazling bilan O‘zingdan o‘zgadan meni behojat qilgin, ey mag‘firati keng Zot! Allohim! Bayting ulug‘dir, Zoting karimdir. Allohim! O‘zing halim, karim, azim Zotsan. Afvni xush ko‘rasan, meni mag‘firat qilgin"
      },
      "uz_cyr": {
        "title": "6-айланиш",
        "instructions": "Олтинчи айланиш. Қалбингизни дуода ҳозир тутинг. Осон бўлса Ямоний бурчакка қўл тегизинг, бошида Қора Тошга истилом қилинг.",
        "note": "Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади.",
        "dua_transliteration": "Аллоҳумма! Инна лака алайя ҳуқуқан касиротан фий маа байний ва байнака, ва ҳуқуқон касийротан фий маа байний ва байна ҳолқик. Аллоҳумма! Маа каана лака минҳаа фағфирҳу лий, ва маа каана лихолқика, фатаҳаммилҳу ъанний вағниний биҳалаалика ъан роҳматика ва битоъатика ъан маъсиятик ва бифадлика амман сиваак, йаа ваасиъал мағфироҳ! Аллоҳумма! Инна байтика ъазийм, ва важҳака карийм. Ва анта, йаа Аллоҳ, ҳалимун кариймун ъазиймун! Туҳиббул ъафва, фаъфу ъанний",
        "dua_translation": "Аллоҳим! Сен билан менинг орамда Сен учун улкан ҳақлар бор. Мен билан махлуқотларинг ўртасида ҳам улкан ҳақлар бор. Ўша ҳақлардан Сен учун бўлганини мендан мағфират қилгин. Махлуқотларинг учун бўлган ҳақни кечириб юборишни зиммангга олгин. Ҳалолинг билан ҳаромингдан, тоатинг билан Сенга маъсият қилишдан, фазлинг билан Ўзингдан ўзгадан мени беҳожат қилгин, эй мағфирати кенг Зот! Аллоҳим! Байтинг улуғдир, Зотинг каримдир. Аллоҳим! Ўзинг ҳалим, карим, азим Зотсан. Афвни хуш кўрасан, мени мағфират қилгин"
      },
      "ru": {
        "title": "Круг 6",
        "instructions": "Шестой круг. Сохраняйте сердце в дуа. Коснитесь Йеменского угла, если это легко, и поприветствуйте Чёрный камень в начале.",
        "note": "Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа.",
        "dua_transliteration": "Аллохумма! Инна лака алайя хукукан касиротан фий маа байний ва байнака, ва хукукон касийротан фий маа байний ва байна холкик. Аллохумма! Маа каана лака минхаа фагфирху лий, ва маа каана лихолкика, фатахаммилху ъанний вагниний бихалаалика ъан рохматика ва битоъатика ъан маъсиятик ва бифадлика амман сиваак, йаа ваасиъал магфирох! Аллохумма! Инна байтика ъазийм, ва важхака карийм. Ва анта, йаа Аллох, халимун кариймун ъазиймун! Тухиббул ъафва, фаъфу ъанний",
        "dua_translation": "О Аллах, у Тебя есть передо мной множество прав в том, что между мной и Тобой, и множество прав в том, что между мной и Твоими творениями. О Аллах, прости мне то из них, что принадлежит Тебе, а то, что принадлежит Твоим творениям, возьми на Себя. Избавь меня Твоим дозволенным от нужды в запретном, покорностью Тебе — от ослушания Тебя, Твоей милостью — от нужды в ком-либо, кроме Тебя, о Обладающий обширным прощением! О Аллах, Твой Дом велик, и Ты Благороден. О Аллах, Ты — Кроткий, Щедрый, Великий. Ты любишь прощать — так прости меня."
      }
    },
    "duas": [
      {
        "dua_arabic": "اللهم ان لك علي حقوقا كثيرة فيما بيني وبينك وحقوقا كثيرة فيما بيني وبين حلقك اللهم ما كان لك منها فاغفره لي وما كان لخلقك فتحمله عني واغنني بحلالك عن حرامك وبطاعتك عن معصيتك وبفضلك عمن سواك يا واسع المغفرة اللهم ان بيتك عظيم ووجهك كريم وانت يا الله حليم كريم عظيم تحب العفو فاعف عني.",
        "translations": {
          "en": {
            "title": "Du‘a of circuit 6",
            "transliteration": "Allāhumma inna laka ʿalayya ḥuqūqan kathīratan fīmā baynī wa baynak, wa ḥuqūqan kathīratan fīmā baynī wa bayna khalqik. Allāhumma mā kāna laka minhā faghfirhu lī, wa mā kāna li-khalqika fataḥammalhu ʿannī, wa aghninī bi-ḥalālika ʿan ḥarāmik, wa bi-ṭāʿatika ʿan maʿṣiyatik, wa bi-faḍlika ʿamman siwāk, yā wāsiʿa-l-maghfirah. Allāhumma inna baytaka ʿaẓīm, wa wajhaka karīm, wa anta yā Allāhu ḥalīmun karīmun ʿaẓīm, tuḥibbu-l-ʿafwa faʿfu ʿannī.",
            "translation": "O Allah, You have many rights over me in what is between You and me, and there are many rights in what is between me and Your creation. O Allah, forgive me what of them is due to You, and take upon Yourself what is due to Your creation. By Your lawful make me free of need of Your unlawful, by obedience to You free of disobeying You, and by Your bounty free of anyone besides You, O You whose forgiveness is vast! O Allah, Your House is great and You are Noble. O Allah, You are Forbearing, Generous and Great. You love to pardon, so pardon me.",
            "reference": "Kitab al-Manasik"
          },
          "uz_latin": {
            "title": "6-aylanish duosi",
            "transliteration": "Allohumma! Inna laka alayya huquqan kasirotan fiy maa bayniy va baynaka, va huquqon kasiyrotan fiy maa bayniy va bayna holqik. Allohumma! Maa kaana laka minhaa fag‘firhu liy, va maa kaana lixolqika, fatahammilhu ’anniy vag‘niniy bihalaalika ’an rohmatika va bito’atika ’an ma’siyatik va bifadlika amman sivaak, yaa vaasi’al mag‘firoh! Allohumma! Inna baytika ’aziym, va vajhaka kariym. Va anta, yaa Alloh, halimun kariymun ’aziymun! Tuhibbul ’afva, fa’fu ’anniy",
            "translation": "Allohim! Sen bilan mening oramda Sen uchun ulkan haqlar bor. Men bilan maxluqotlaring o‘rtasida ham ulkan haqlar bor. O‘sha haqlardan Sen uchun bo‘lganini mendan mag‘firat qilgin. Maxluqotlaring uchun bo‘lgan haqni kechirib yuborishni zimmangga olgin. Haloling bilan haromingdan, toating bilan Senga ma’siyat qilishdan, fazling bilan O‘zingdan o‘zgadan meni behojat qilgin, ey mag‘firati keng Zot! Allohim! Bayting ulug‘dir, Zoting karimdir. Allohim! O‘zing halim, karim, azim Zotsan. Afvni xush ko‘rasan, meni mag‘firat qilgin",
            "reference": "Kitobi manaasik"
          },
          "uz_cyr": {
            "title": "6-айланиш дуоси",
            "transliteration": "Аллоҳумма! Инна лака алайя ҳуқуқан касиротан фий маа байний ва байнака, ва ҳуқуқон касийротан фий маа байний ва байна ҳолқик. Аллоҳумма! Маа каана лака минҳаа фағфирҳу лий, ва маа каана лихолқика, фатаҳаммилҳу ъанний вағниний биҳалаалика ъан роҳматика ва битоъатика ъан маъсиятик ва бифадлика амман сиваак, йаа ваасиъал мағфироҳ! Аллоҳумма! Инна байтика ъазийм, ва важҳака карийм. Ва анта, йаа Аллоҳ, ҳалимун кариймун ъазиймун! Туҳиббул ъафва, фаъфу ъанний",
            "translation": "Аллоҳим! Сен билан менинг орамда Сен учун улкан ҳақлар бор. Мен билан махлуқотларинг ўртасида ҳам улкан ҳақлар бор. Ўша ҳақлардан Сен учун бўлганини мендан мағфират қилгин. Махлуқотларинг учун бўлган ҳақни кечириб юборишни зиммангга олгин. Ҳалолинг билан ҳаромингдан, тоатинг билан Сенга маъсият қилишдан, фазлинг билан Ўзингдан ўзгадан мени беҳожат қилгин, эй мағфирати кенг Зот! Аллоҳим! Байтинг улуғдир, Зотинг каримдир. Аллоҳим! Ўзинг ҳалим, карим, азим Зотсан. Афвни хуш кўрасан, мени мағфират қилгин",
            "reference": "Китоби манаасик"
          },
          "ru": {
            "title": "Дуа 6-го круга",
            "transliteration": "Аллохумма! Инна лака алайя хукукан касиротан фий маа байний ва байнака, ва хукукон касийротан фий маа байний ва байна холкик. Аллохумма! Маа каана лака минхаа фагфирху лий, ва маа каана лихолкика, фатахаммилху ъанний вагниний бихалаалика ъан рохматика ва битоъатика ъан маъсиятик ва бифадлика амман сиваак, йаа ваасиъал магфирох! Аллохумма! Инна байтика ъазийм, ва важхака карийм. Ва анта, йаа Аллох, халимун кариймун ъазиймун! Тухиббул ъафва, фаъфу ъанний",
            "translation": "О Аллах, у Тебя есть передо мной множество прав в том, что между мной и Тобой, и множество прав в том, что между мной и Твоими творениями. О Аллах, прости мне то из них, что принадлежит Тебе, а то, что принадлежит Твоим творениям, возьми на Себя. Избавь меня Твоим дозволенным от нужды в запретном, покорностью Тебе — от ослушания Тебя, Твоей милостью — от нужды в ком-либо, кроме Тебя, о Обладающий обширным прощением! О Аллах, Твой Дом велик, и Ты Благороден. О Аллах, Ты — Кроткий, Щедрый, Великий. Ты любишь прощать — так прости меня.",
            "reference": "Китаб аль-Манасик"
          }
        }
      },
      {
        "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَفِي الْآخِرَةِ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وأدخلنا الجنة مع الأبرار يا عزيز يا غفار يا رب العالمين.",
        "translations": {
          "en": {
            "title": "Between the Yemeni Corner and the Black Stone",
            "transliteration": "Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.",
            "translation": "O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!",
            "reference": null
          },
          "uz_latin": {
            "title": "Rukni Yamoniy bilan Hajarul Asvad orasida",
            "transliteration": "Allohumma! Inniy as’alukal ’afva val-ofiyata fid-dunyaa va fil-aaxiro. Robbanaa aatinaa fid-dunyaa hasanatan va fil aaxiroti hasanatan va qinaa ’azaban-naar. Vadxilnal jannata ma’al abror, yaa ’aziyz, yaa G‘offar, yaa Robbal ’aalamiyn",
            "translation": "Allohim! Sendan dunyoyu oxiratda afv va ofiyat so‘rayman. Robbimiz! Bizlarga dunyoda ham, oxiratda ham yaxshilik ato qilib, bizlarni do‘zax azobidan saqlagin. Bizlarni abror bandalaring bilan jannatga kirgizgin, ey Aziz, ey G‘affor, ey olamlar Robbi!",
            "reference": null
          },
          "uz_cyr": {
            "title": "Рукни Ямоний билан Ҳажарул Асвад орасида",
            "transliteration": "Аллоҳумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа аатинаа фид-дунйаа ҳасанатан ва фил аахироти ҳасанатан ва қинаа ъазабан-наар. Вадхилнал жанната маъал аброр, йаа Ъазийз, йаа Ғоффар, йаа Роббал ъааламийн",
            "translation": "Аллоҳим! Сендан дунёю охиратда афв ва офият сўрайман. Роббимиз! Бизларга дунёда ҳам, охиратда ҳам яхшилик ато қилиб, бизларни дўзах азобидан сақлагин. Бизларни аброр бандаларинг билан жаннатга киргизгин, эй Азиз, эй Ғаффор, эй оламлар Робби!",
            "reference": null
          },
          "ru": {
            "title": "Между Йеменским углом и Чёрным камнем",
            "transliteration": "Аллохумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа аатинаа фид-дунйаа хасанатан ва фил аахироти хасанатан ва кинаа ъазабан-наар. Вадхилнал жанната маъал аброр, йаа Ъазийз, йаа Гоффар, йаа Роббал ъааламийн",
            "translation": "О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!",
            "reference": null
          }
        }
      }
    ]
  },
  {
    "sort_order": 7,
    "dua_arabic": "اللهم إني أسألك إيماناً كاملاً، ويقيناً صادقاً ورزقا واسعا وقلبا خاشعا ولسانا ذاكرا وحلالا طيبا وتوبة نصوحا وتوبة قبل الموت ومغفرة ورحمة بعد الموت والعفو عند الحساب والفوز بالجنة والنجاة من النار برحمتك يا عزيز يا غفار رب زدني علما والحقني بالصالحين.",
    "translations": {
      "en": {
        "title": "Circuit 7",
        "instructions": "Final round. Salute the Black Stone, complete the circuit, then move to pray two rak‘ahs behind Maqām Ibrāhīm.",
        "note": "Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited. This completes the Tawaf.",
        "dua_transliteration": "Allāhumma innī asʾaluka īmānan kāmilā, wa yaqīnan ṣādiqā, wa rizqan wāsiʿā, wa qalban khāshiʿā, wa lisānan dhākirā, wa ḥalālan ṭayyibā, wa tawbatan naṣūḥā, wa tawbatan qabla-l-mawt, wa maghfiratan wa raḥmatan baʿda-l-mawt, wal-ʿafwa ʿinda-l-ḥisāb, wal-fawza bil-jannati wan-najāta mina-n-nār, bi-raḥmatika yā ʿAzīzu yā Ghaffār. Rabbi zidnī ʿilman wa alḥiqnī biṣ-ṣāliḥīn.",
        "dua_translation": "O Allah, I ask You for perfect faith, true certainty, abundant provision, a humble heart, a tongue that remembers You, lawful and pure provision, sincere repentance, repentance before death, ease at the time of death, and forgiveness and mercy after death. I ask You for pardon at the Reckoning, and that by Your mercy I attain Paradise and am saved from the Fire. My Lord, increase me in knowledge and join me with the righteous."
      },
      "uz_latin": {
        "title": "7-aylanish",
        "instructions": "Oxirgi aylanish. Qora Toshga istilom qiling, aylanishni tugating, so‘ng Maqomi Ibrohim ortida ikki rakat namoz o‘qishga o‘ting.",
        "note": "Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi. Shu bilan Tavof tugaydi.",
        "dua_transliteration": "Allohumma! Inniy as’aluka iymaanan kaamilan, va yaqiynan sodiqon, va rizqon vaasi’an, va qolban xoshi’an, va lisaanan zokiron, va halaalan toyyiban, va tavbatan nasuhan, va tavbatan qoblal mavti, va mag‘firotan va rohmatan ba’dal mavti, val-’afva ’indal hisaabi, val-favza bil jannati van-najaata minan-naari, birohmatika yaa Aziz, yaa G‘offaar! Robbi, zidniy ’ilman va alhiqniy bis-solihiyn",
        "dua_translation": "Allohim! Men Sendan komil iymon, haqiqiy ishonch, keng rizq, siniq qalb, zikr qiluvchi til, halol-pok rizq, chin tavba, o‘limdan oldingi tavba, o‘lim vaqtida rohat, o‘limdan keyin mag‘firat va rahmat so‘rayman. Hisob vaqtida o‘tim qilishingni, rahmating ila jannatga ega qilib, do‘zaxdan panoh berishingni so‘rayman. Allohim! Ilmimni ziyoda qilgin va solih bandalaring safiga qo‘shgin"
      },
      "uz_cyr": {
        "title": "7-айланиш",
        "instructions": "Охирги айланиш. Қора Тошга истилом қилинг, айланишни тугатинг, сўнг Мақоми Иброҳим ортида икки ракат намоз ўқишга ўтинг.",
        "note": "Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади. Шу билан Тавоф тугайди.",
        "dua_transliteration": "Аллоҳумма! Инний асъалука иймаанан каамилан, ва яқийнан содиқон, ва ризқон ваасиъан, ва қолбан хошиъан, ва лисаанан зокирон, ва ҳалаалан тоййибан, ва тавбатан насуҳан, ва тавбатан қоблал мавти, ва мағфиротан ва роҳматан баъдал мавти, вал-ъафва ъиндал ҳисааби, вал-фавза бил жаннати ван-нажаата минан-наари, бироҳматика йаа Азиз, йаа Ғоффаар! Робби, зидний ъилман ва алҳиқний бис-солиҳийн",
        "dua_translation": "Аллоҳим! Мен Сендан комил иймон, ҳақиқий ишонч, кенг ризқ, синиқ қалб, зикр қилувчи тил, ҳалол-пок ризқ, чин тавба, ўлимдан олдинги тавба, ўлим вақтида роҳат, ўлимдан кейин мағфират ва раҳмат сўрайман. Ҳисоб вақтида ўтим қилишингни, раҳматинг ила жаннатга эга қилиб, дўзахдан паноҳ беришингни сўрайман. Аллоҳим! Илмимни зиёда қилгин ва солиҳ бандаларинг сафига қўшгин"
      },
      "ru": {
        "title": "Круг 7",
        "instructions": "Последний круг. Поприветствуйте Чёрный камень, завершите круг, затем совершите два ракаата за Макамом Ибрахима.",
        "note": "Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа. На этом Таваф завершается.",
        "dua_transliteration": "Аллохумма! Инний асъалука иймаанан каамилан, ва якийнан содикон, ва ризкон ваасиъан, ва колбан хошиъан, ва лисаанан зокирон, ва халаалан тоййибан, ва тавбатан насухан, ва тавбатан коблал мавти, ва магфиротан ва рохматан баъдал мавти, вал-ъафва ъиндал хисааби, вал-фавза бил жаннати ван-нажаата минан-наари, бирохматика йаа Азиз, йаа Гоффаар! Робби, зидний ъилман ва алхикний бис-солихийн",
        "dua_translation": "О Аллах, прошу у Тебя совершенной веры, истинной убеждённости, широкого удела, смиренного сердца, языка, поминающего Тебя, дозволенного и чистого удела, искреннего покаяния, покаяния до смерти, облегчения в час смерти, прощения и милости после смерти. Прошу Тебя о прощении при расчёте и о том, чтобы по Твоей милости обрести Рай и спастись от Огня. Господи, приумножь моё знание и присоедини меня к праведникам."
      }
    },
    "duas": [
      {
        "dua_arabic": "اللهم إني أسألك إيماناً كاملاً، ويقيناً صادقاً ورزقا واسعا وقلبا خاشعا ولسانا ذاكرا وحلالا طيبا وتوبة نصوحا وتوبة قبل الموت ومغفرة ورحمة بعد الموت والعفو عند الحساب والفوز بالجنة والنجاة من النار برحمتك يا عزيز يا غفار رب زدني علما والحقني بالصالحين.",
        "translations": {
          "en": {
            "title": "Du‘a of circuit 7",
            "transliteration": "Allāhumma innī asʾaluka īmānan kāmilā, wa yaqīnan ṣādiqā, wa rizqan wāsiʿā, wa qalban khāshiʿā, wa lisānan dhākirā, wa ḥalālan ṭayyibā, wa tawbatan naṣūḥā, wa tawbatan qabla-l-mawt, wa maghfiratan wa raḥmatan baʿda-l-mawt, wal-ʿafwa ʿinda-l-ḥisāb, wal-fawza bil-jannati wan-najāta mina-n-nār, bi-raḥmatika yā ʿAzīzu yā Ghaffār. Rabbi zidnī ʿilman wa alḥiqnī biṣ-ṣāliḥīn.",
            "translation": "O Allah, I ask You for perfect faith, true certainty, abundant provision, a humble heart, a tongue that remembers You, lawful and pure provision, sincere repentance, repentance before death, ease at the time of death, and forgiveness and mercy after death. I ask You for pardon at the Reckoning, and that by Your mercy I attain Paradise and am saved from the Fire. My Lord, increase me in knowledge and join me with the righteous.",
            "reference": "Kitab al-Manasik"
          },
          "uz_latin": {
            "title": "7-aylanish duosi",
            "transliteration": "Allohumma! Inniy as’aluka iymaanan kaamilan, va yaqiynan sodiqon, va rizqon vaasi’an, va qolban xoshi’an, va lisaanan zokiron, va halaalan toyyiban, va tavbatan nasuhan, va tavbatan qoblal mavti, va mag‘firotan va rohmatan ba’dal mavti, val-’afva ’indal hisaabi, val-favza bil jannati van-najaata minan-naari, birohmatika yaa Aziz, yaa G‘offaar! Robbi, zidniy ’ilman va alhiqniy bis-solihiyn",
            "translation": "Allohim! Men Sendan komil iymon, haqiqiy ishonch, keng rizq, siniq qalb, zikr qiluvchi til, halol-pok rizq, chin tavba, o‘limdan oldingi tavba, o‘lim vaqtida rohat, o‘limdan keyin mag‘firat va rahmat so‘rayman. Hisob vaqtida o‘tim qilishingni, rahmating ila jannatga ega qilib, do‘zaxdan panoh berishingni so‘rayman. Allohim! Ilmimni ziyoda qilgin va solih bandalaring safiga qo‘shgin",
            "reference": "Kitobi manaasik"
          },
          "uz_cyr": {
            "title": "7-айланиш дуоси",
            "transliteration": "Аллоҳумма! Инний асъалука иймаанан каамилан, ва яқийнан содиқон, ва ризқон ваасиъан, ва қолбан хошиъан, ва лисаанан зокирон, ва ҳалаалан тоййибан, ва тавбатан насуҳан, ва тавбатан қоблал мавти, ва мағфиротан ва роҳматан баъдал мавти, вал-ъафва ъиндал ҳисааби, вал-фавза бил жаннати ван-нажаата минан-наари, бироҳматика йаа Азиз, йаа Ғоффаар! Робби, зидний ъилман ва алҳиқний бис-солиҳийн",
            "translation": "Аллоҳим! Мен Сендан комил иймон, ҳақиқий ишонч, кенг ризқ, синиқ қалб, зикр қилувчи тил, ҳалол-пок ризқ, чин тавба, ўлимдан олдинги тавба, ўлим вақтида роҳат, ўлимдан кейин мағфират ва раҳмат сўрайман. Ҳисоб вақтида ўтим қилишингни, раҳматинг ила жаннатга эга қилиб, дўзахдан паноҳ беришингни сўрайман. Аллоҳим! Илмимни зиёда қилгин ва солиҳ бандаларинг сафига қўшгин",
            "reference": "Китоби манаасик"
          },
          "ru": {
            "title": "Дуа 7-го круга",
            "transliteration": "Аллохумма! Инний асъалука иймаанан каамилан, ва якийнан содикон, ва ризкон ваасиъан, ва колбан хошиъан, ва лисаанан зокирон, ва халаалан тоййибан, ва тавбатан насухан, ва тавбатан коблал мавти, ва магфиротан ва рохматан баъдал мавти, вал-ъафва ъиндал хисааби, вал-фавза бил жаннати ван-нажаата минан-наари, бирохматика йаа Азиз, йаа Гоффаар! Робби, зидний ъилман ва алхикний бис-солихийн",
            "translation": "О Аллах, прошу у Тебя совершенной веры, истинной убеждённости, широкого удела, смиренного сердца, языка, поминающего Тебя, дозволенного и чистого удела, искреннего покаяния, покаяния до смерти, облегчения в час смерти, прощения и милости после смерти. Прошу Тебя о прощении при расчёте и о том, чтобы по Твоей милости обрести Рай и спастись от Огня. Господи, приумножь моё знание и присоедини меня к праведникам.",
            "reference": "Китаб аль-Манасик"
          }
        }
      },
      {
        "dua_arabic": "اللَّهُمَّ إنِّي أَسْأَلُك الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَفِي الْآخِرَةِ رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ وأدخلنا الجنة مع الأبرار يا عزيز يا غفار يا رب العالمين.",
        "translations": {
          "en": {
            "title": "Between the Yemeni Corner and the Black Stone",
            "transliteration": "Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.",
            "translation": "O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!",
            "reference": null
          },
          "uz_latin": {
            "title": "Rukni Yamoniy bilan Hajarul Asvad orasida",
            "transliteration": "Allohumma! Inniy as’alukal ’afva val-ofiyata fid-dunyaa va fil-aaxiro. Robbanaa! Aatinaa fid-dunyaa hasanatan va fil aaxiroti hasanatan va qinaa ’azaban naar! Vadxilnal jannata ma’al abror, yaa ’aziyz, yaa G‘offar, yaa Robbal ’aalamiyn",
            "translation": "Allohim! Sendan dunyoyu oxiratda afv va ofiyat so‘rayman. Robbimiz! Bizlarga dunyoda ham, oxiratda ham yaxshilik ato qilib, bizlarni do‘zax azobidan saqlagin. Bizlarni abror bandalaring bilan jannatga kirgizgin, ey Aziz, ey G‘affor, ey olamlar Robbi!",
            "reference": null
          },
          "uz_cyr": {
            "title": "Рукни Ямоний билан Ҳажарул Асвад орасида",
            "transliteration": "Аллоҳумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа ҳасанатан ва фил аахироти ҳасанатан ва қинаа ъазабан наар! Вадхилнал жанната маъал аброр, йаа Ъазийз, йаа Ғоффар, йаа Роббал ъааламийн",
            "translation": "Аллоҳим! Сендан дунёю охиратда афв ва офият сўрайман. Роббимиз! Бизларга дунёда ҳам, охиратда ҳам яхшилик ато қилиб, бизларни дўзах азобидан сақлагин. Бизларни аброр бандаларинг билан жаннатга киргизгин, эй Азиз, эй Ғаффор, эй оламлар Робби!",
            "reference": null
          },
          "ru": {
            "title": "Между Йеменским углом и Чёрным камнем",
            "transliteration": "Аллохумма! Инний асъалукал ъафва вал-офията фид-дунйаа ва фил-аахиро. Роббанаа! Аатинаа фид-дунйаа хасанатан ва фил аахироти хасанатан ва кинаа ъазабан наар! Вадхилнал жанната маъал аброр, йаа Ъазийз, йаа Гоффар, йаа Роббал ъааламийн",
            "translation": "О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!",
            "reference": null
          }
        }
      }
    ]
  }
];

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
