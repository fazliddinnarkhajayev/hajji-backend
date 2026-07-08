import type { Knex } from 'knex';

// Umrah ritual steps with translations (en, uz_latin, uz_cyr, ru), derived from
// the hajji-guide app's built-in umrahSteps + i18n locale content. Hajj steps
// are left to be added later via the admin panel.
const UMRAH_STEPS: Array<{
  sort_order: number;
  arabic: string | null;
  dua_arabic: string | null;
  translations: Record<
    string,
    {
      name: string | null;
      description: string | null;
      location: string | null;
      duration: string | null;
      instructions: string | null;
      dua_transliteration: string | null;
      dua_translation: string | null;
    }
  >;
}> = [
  { sort_order: 0, arabic: 'الإحرام', dua_arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', translations: {
    en: { name: 'Ihram', description: 'Enter the sacred state of pilgrimage', location: 'At the Miqat', duration: '20–30 min', instructions: 'Perform ghusl, wear the two white garments, and make your intention (niyyah) for Umrah before crossing the Miqat boundary. From this point, the restrictions of ihram apply.', dua_transliteration: 'Labbayka-llāhumma ʿumrah', dua_translation: 'Here I am, O Allah, for Umrah.' },
    uz_latin: { name: 'Ihram', description: 'Ziyoratning muqaddas holatiga kiring', location: 'Miyqotda', duration: '20-30 daqiqa', instructions: 'Gusl qiling, ikki oq kiyimni kiying va Miyqot chegarasidan o‘tishdan oldin Umra niyatini qiling. Shu paytdan boshlab ihram cheklovlari amal qiladi.', dua_transliteration: 'Allahumma-ftah li abwaba rahmatik', dua_translation: 'Allohim, rahmating eshiklarini menga och.' },
    uz_cyr: { name: 'Иҳром', description: 'Зиёратнинг муқаддас ҳолатига киринг', location: 'Мийқотда', duration: '20-30 дақиқа', instructions: 'Ғусл қилинг, икки оқ кийимни кийинг ва Мийқот чегарасидан ўтишдан олдин Умра ниятини қилинг.', dua_transliteration: 'Allahumma-ftah li abwaba rahmatik', dua_translation: 'Аллоҳим, раҳматинг эшикларини менга оч.' },
    ru: { name: 'Ихрам', description: 'Войдите в священное состояние паломничества', location: 'У миката', duration: '20-30 мин', instructions: 'Совершите гусль, наденьте две белые ткани и сделайте намерение на Умру до пересечения границы миката.', dua_transliteration: 'Allahumma-ftah li abwaba rahmatik', dua_translation: 'О Аллах, открой мне врата Твоей милости.' },
  } },
  { sort_order: 1, arabic: 'التلبية', dua_arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْك', translations: {
    en: { name: 'Talbiyah', description: "Recite the pilgrim's response", location: 'On the way to Makkah', duration: 'Ongoing', instructions: 'Repeat the Talbiyah aloud and often as you travel toward the Haram. Men raise their voices; women say it softly. Continue until you begin Tawaf.', dua_transliteration: 'Labbayka-llāhumma labbayk, labbayka lā sharīka laka labbayk', dua_translation: 'Here I am, O Allah, here I am. You have no partner; here I am.' },
    uz_latin: { name: 'Talbiya', description: 'Ziyoratchining javob duosini ayting', location: 'Makkaga yo‘lda', duration: 'Davomiy', instructions: 'Haram tomon borar ekansiz Talbiyani tez-tez takrorlang. Erkaklar ovozini balandroq, ayollar esa pastroq aytadi. Tavof boshlanguncha davom eting.', dua_transliteration: 'Labbayka-llahumma labbayk', dua_translation: 'Labbayk, ey Alloh, labbayk.' },
    uz_cyr: { name: 'Талбия', description: 'Зиёратчининг жавоб дуосини айтинг', location: 'Маккага йўлда', duration: 'Давомий', instructions: 'Ҳарам томон борар экансиз Талбияни тез-тез такрорланг.', dua_transliteration: 'Labbayka-llahumma labbayk', dua_translation: 'Лаббайк, эй Аллоҳ, лаббайк.' },
    ru: { name: 'Тальбия', description: 'Произнесите ответ паломника', location: 'По дороге в Мекку', duration: 'Постоянно', instructions: 'Часто повторяйте Тальбию по пути к Хараму. Продолжайте до начала Тавафа.', dua_transliteration: 'Labbayka-llahumma labbayk', dua_translation: 'Вот я перед Тобой, о Аллах.' },
  } },
  { sort_order: 2, arabic: 'الطواف', dua_arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَر', translations: {
    en: { name: 'Tawaf', description: 'Seven circuits around the Kaaba', location: 'Mataf, Masjid al-Haram', duration: '40–60 min', instructions: 'Begin at the corner of the Black Stone. Keep the Kaaba on your left and circle anticlockwise seven times. Men do raml (brisk pace) in the first three rounds.', dua_transliteration: 'Bismillāhi wa-llāhu akbar, allāhumma īmānan bika', dua_translation: 'In the name of Allah, Allah is greatest. O Allah, with faith in You.' },
    uz_latin: { name: 'Tavof', description: 'Ka‘ba atrofida yetti marta aylaning', location: 'Mataf, Masjid al-Haram', duration: '40-60 daqiqa', instructions: 'Qora Tosh burchagidan boshlang. Ka‘bani chap tomoningizda qoldirib, soat miliga teskari yetti marta aylaning.', dua_transliteration: 'Bismillahi wa-llahu akbar', dua_translation: 'Alloh nomi bilan, Alloh buyukdir.' },
    uz_cyr: { name: 'Тавоф', description: 'Каъба атрофида етти марта айланинг', location: 'Матаф, Масжид ал-Ҳарам', duration: '40-60 дақиқа', instructions: 'Қора Тош бурчагидан бошланг. Каъбани чап томонингизда қолдириб, соат милига тескари етти марта айланинг.', dua_transliteration: 'Bismillahi wa-llahu akbar', dua_translation: 'Аллоҳ номи билан, Аллоҳ буюкдир.' },
    ru: { name: 'Таваф', description: 'Семь обходов вокруг Каабы', location: 'Матаф, Масджид аль-Харам', duration: '40-60 мин', instructions: 'Начните у угла Чёрного камня. Держите Каабу слева и обойдите её семь раз против часовой стрелки.', dua_transliteration: 'Bismillahi wa-llahu akbar', dua_translation: 'С именем Аллаха, Аллах велик.' },
  } },
  { sort_order: 3, arabic: 'ركعتا الطواف', dua_arabic: 'وَاتَّخِذُوا مِنْ مَقَامِ إِبْرَاهِيمَ مُصَلًّى', translations: {
    en: { name: 'Two rakahs', description: 'Pray at Maqam Ibrahim', location: 'Behind Maqam Ibrahim', duration: '5–10 min', instructions: 'After Tawaf, offer two short rakahs behind the Station of Ibrahim if space allows, otherwise anywhere in the mosque. Recite Surah al-Kafirun and al-Ikhlas.', dua_transliteration: 'Wattakhidhū min maqāmi Ibrāhīma muṣallā', dua_translation: 'And take the Station of Ibrahim as a place of prayer.' },
    uz_latin: { name: 'Ikki rakat', description: 'Maqomi Ibrohim yonida namoz o‘qing', location: 'Maqomi Ibrohim ortida', duration: '5-10 daqiqa', instructions: 'Tavofdan keyin imkon bo‘lsa Maqomi Ibrohim ortida ikki rakat namoz o‘qing, bo‘lmasa masjidning istalgan joyida o‘qing.', dua_transliteration: 'Wattakhidhu min maqami Ibrahima musalla', dua_translation: 'Maqomi Ibrohimni namoz joyi qiling.' },
    uz_cyr: { name: 'Икки ракат', description: 'Мақоми Иброҳим ёнида намоз ўқинг', location: 'Мақоми Иброҳим ортида', duration: '5-10 дақиқа', instructions: 'Тавофдан кейин имкон бўлса Мақоми Иброҳим ортида икки ракат намоз ўқинг.', dua_transliteration: 'Wattakhidhu min maqami Ibrahima musalla', dua_translation: 'Мақоми Иброҳимни намоз жойи қилинг.' },
    ru: { name: 'Два ракаата', description: 'Совершите молитву у Макама Ибрахима', location: 'За Макамом Ибрахима', duration: '5-10 мин', instructions: 'После Тавафа совершите два коротких ракаата за Макамом Ибрахима, если есть место.', dua_transliteration: 'Wattakhidhu min maqami Ibrahima musalla', dua_translation: 'Сделайте Макам Ибрахима местом молитвы.' },
  } },
  { sort_order: 4, arabic: 'ماء زمزم', dua_arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا', translations: {
    en: { name: 'Zamzam', description: 'Drink from the sacred well', location: 'Zamzam dispensers', duration: '5 min', instructions: "Drink your fill of Zamzam water facing the Qiblah, in three breaths, and make sincere du'a — it is answered for whatever purpose it is drunk.", dua_transliteration: "Allāhumma innī as'aluka ʿilman nāfiʿan wa rizqan wāsiʿā", dua_translation: 'O Allah, I ask You for beneficial knowledge and abundant provision.' },
    uz_latin: { name: 'Zamzam', description: 'Muqaddas quduq suvidan iching', location: 'Zamzam dispenserlari', duration: '5 daqiqa', instructions: 'Qiblaga yuzlanib, uch nafasda Zamzam iching va samimiy duo qiling.', dua_transliteration: "Allahumma inni as'aluka ilman nafian wa rizqan wasian", dua_translation: 'Allohim, Sendan foydali ilm va keng rizq so‘rayman.' },
    uz_cyr: { name: 'Замзам', description: 'Муқаддас қудуқ сувидан ичинг', location: 'Замзам диспенсерлари', duration: '5 дақиқа', instructions: 'Қиблага юзланиб, уч нафасда Замзам ичинг ва самимий дуо қилинг.', dua_transliteration: "Allahumma inni as'aluka ilman nafian wa rizqan wasian", dua_translation: 'Аллоҳим, Сендан фойдали илм ва кенг ризқ сўрайман.' },
    ru: { name: 'Замзам', description: 'Выпейте воду из священного колодца', location: 'Диспенсеры Замзама', duration: '5 мин', instructions: 'Пейте Замзам, повернувшись к Кибле, в три глотка, и сделайте искреннее дуа.', dua_transliteration: "Allahumma inni as'aluka ilman nafian wa rizqan wasian", dua_translation: 'О Аллах, прошу у Тебя полезного знания и широкого удела.' },
  } },
  { sort_order: 5, arabic: 'السعي', dua_arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّه', translations: {
    en: { name: "Sa'i", description: 'Walk between Safa and Marwah', location: "Mas'a gallery", duration: '30–45 min', instructions: "Begin at Safa facing the Kaaba and make du'a, then walk to Marwah — seven trips in all. Men jog between the green markers. End at Marwah.", dua_transliteration: "Inna-ṣ-ṣafā wal-marwata min shaʿā'iri-llāh", dua_translation: 'Indeed, Safa and Marwah are among the symbols of Allah.' },
    uz_latin: { name: 'Sa‘y', description: 'Safo va Marva orasida yuring', location: 'Mas‘a yo‘lagi', duration: '30-45 daqiqa', instructions: 'Safoda Ka‘baga yuzlanib duo qiling, so‘ng Marvaga boring. Jami yetti qatnov bo‘ladi.', dua_transliteration: "Inna-s-safa wal-marwata min sha'airi-llah", dua_translation: 'Albatta Safo va Marva Allohning belgilaridandir.' },
    uz_cyr: { name: 'Саъй', description: 'Сафо ва Марва орасида юринг', location: 'Масъа йўлаги', duration: '30-45 дақиқа', instructions: 'Сафода Каъбага юзланиб дуо қилинг, сўнг Марвага боринг. Жами етти қатнов бўлади.', dua_transliteration: "Inna-s-safa wal-marwata min sha'airi-llah", dua_translation: 'Албатта Сафо ва Марва Аллоҳнинг белгиларидандир.' },
    ru: { name: 'Сай', description: 'Пройдите между Сафа и Марва', location: 'Галерея Масъа', duration: '30-45 мин', instructions: 'Начните на Сафа, повернитесь к Каабе и сделайте дуа, затем идите к Марва. Всего семь проходов.', dua_transliteration: "Inna-s-safa wal-marwata min sha'airi-llah", dua_translation: 'Воистину, Сафа и Марва из знамений Аллаха.' },
  } },
  { sort_order: 6, arabic: 'الحلق والتقصير', dua_arabic: 'اللَّهُمَّ اغْفِرْ لِلْمُحَلِّقِينَ', translations: {
    en: { name: 'Halq / Taqsir', description: 'Shave or trim the hair', location: 'Near Marwah', duration: '10 min', instructions: "Men shave the head completely (halq) or trim evenly (taqsir); shaving is more rewarding. Women cut a fingertip's length from their hair. This releases you from ihram.", dua_transliteration: 'Allāhumma-ghfir lil-muḥalliqīn', dua_translation: 'O Allah, forgive those who shave their heads.' },
    uz_latin: { name: 'Halq / Taqsir', description: 'Sochni oldiring yoki qisqartiring', location: 'Marva yaqinida', duration: '10 daqiqa', instructions: 'Erkaklar sochini to‘liq oldiradi yoki teng qisqartiradi; ayollar sochidan barmoq uchi miqdorida kesadi.', dua_transliteration: 'Allahumma-ghfir lil-muhalliqin', dua_translation: 'Allohim, sochini oldirganlarni mag‘firat qil.' },
    uz_cyr: { name: 'Ҳалқ / Тақсир', description: 'Сочни олдиринг ёки қисқартиринг', location: 'Марва яқинида', duration: '10 дақиқа', instructions: 'Эркаклар сочини тўлиқ олдиради ёки тенг қисқартиради; аёллар сочидан бармоқ учи миқдорида кесади.', dua_transliteration: 'Allahumma-ghfir lil-muhalliqin', dua_translation: 'Аллоҳим, сочини олдирганларни мағфират қил.' },
    ru: { name: 'Хальк / Таксир', description: 'Сбрейте или подстригите волосы', location: 'Рядом с Марва', duration: '10 мин', instructions: 'Мужчины бреют голову полностью или ровно подстригают волосы; женщины отрезают длину кончика пальца.', dua_transliteration: 'Allahumma-ghfir lil-muhalliqin', dua_translation: 'О Аллах, прости тех, кто сбрил волосы.' },
  } },
  { sort_order: 7, arabic: 'إتمام العمرة', dua_arabic: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَات', translations: {
    en: { name: 'Completion', description: 'Exit ihram and conclude', location: 'Masjid al-Haram', duration: '—', instructions: "Your Umrah is complete and the restrictions of ihram are lifted. Thank Allah for the blessing, and spend your remaining time in prayer and du'a at the Haram.", dua_transliteration: 'Al-ḥamdu lillāhi-lladhī bi-niʿmatihi tatimmu-ṣ-ṣāliḥāt', dua_translation: 'Praise be to Allah by whose grace good deeds are completed.' },
    uz_latin: { name: 'Yakunlash', description: 'Ihramdan chiqing va ziyoratni yakunlang', location: 'Masjid al-Haram', duration: '-', instructions: 'Umrangiz tugadi va ihram cheklovlari ko‘tarildi. Ne‘mat uchun Allohga shukr qiling.', dua_transliteration: 'Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat', dua_translation: 'Yaxshi ishlar Uning ne‘mati bilan tugaydigan Allohga hamd bo‘lsin.' },
    uz_cyr: { name: 'Якунлаш', description: 'Иҳромдан чиқинг ва зиёратни якунланг', location: 'Масжид ал-Ҳарам', duration: '-', instructions: 'Умрангиз тугади ва иҳром чекловлари кўтарилди. Неъмат учун Аллоҳга шукр қилинг.', dua_transliteration: 'Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat', dua_translation: 'Яхши ишлар Унинг неъмати билан тугайдиган Аллоҳга ҳамд бўлсин.' },
    ru: { name: 'Завершение', description: 'Выйдите из ихрама и завершите обряд', location: 'Масджид аль-Харам', duration: '-', instructions: 'Ваша Умра завершена, и ограничения ихрама сняты. Поблагодарите Аллаха за милость.', dua_transliteration: 'Al-hamdu lillahi-lladhi bi-nimatihi tatimmu-s-salihat', dua_translation: 'Хвала Аллаху, по милости Которого завершаются благие дела.' },
  } },
];

exports.up = async function (knex: Knex) {
  const existing = await knex('rituals').where({ type: 'umrah', is_deleted: false }).first();
  if (existing) return; // already seeded

  for (const step of UMRAH_STEPS) {
    const [ritual] = await knex('rituals')
      .insert({
        type: 'umrah',
        sort_order: step.sort_order,
        arabic: step.arabic,
        dua_arabic: step.dua_arabic,
      })
      .returning('id');
    const ritualId = (ritual as any).id ?? ritual;

    for (const [lang, t] of Object.entries(step.translations)) {
      await knex('ritual_translations').insert({
        ritual_id: ritualId,
        lang,
        name: t.name,
        description: t.description,
        location: t.location,
        duration: t.duration,
        instructions: t.instructions,
        dua_transliteration: t.dua_transliteration,
        dua_translation: t.dua_translation,
      });
    }
  }
};

exports.down = async function (knex: Knex) {
  // Translations are removed by the FK cascade.
  await knex('rituals').where({ type: 'umrah' }).del();
};
