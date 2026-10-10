// Hand-written en / ru translations, en transliterations and titles for the
// content du'as. uz_cyr text comes verbatim from the content files; uz_latin is
// a letter-by-letter conversion of it; ru transliteration is the uz_cyr one
// with Russian letters.
const Y_EN = {
  t: 'Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata fi-d-dunyā wa fi-l-ākhirah. Rabbanā ātinā fi-d-dunyā ḥasanatan wa fi-l-ākhirati ḥasanatan wa qinā ʿadhāba-n-nār. Wa adkhilna-l-jannata maʿa-l-abrār, yā ʿAzīzu yā Ghaffār, yā Rabba-l-ʿālamīn.',
  m: 'O Allah, I ask You for pardon and well-being in this world and the Hereafter. Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. Admit us into Paradise with the righteous, O Mighty, O Forgiving, O Lord of the worlds!',
};
const Y_RU = 'О Аллах, прошу у Тебя прощения и благополучия в этом мире и в вечной жизни. Господь наш, даруй нам благо в этом мире и благо в вечной жизни и защити нас от мучений Огня. Введи нас в Рай вместе с праведниками, о Всемогущий, о Прощающий, о Господь миров!';
const Y_TITLE = {
  en: 'Between the Yemeni Corner and the Black Stone',
  uz_latin: 'Rukni Yamoniy bilan Hajarul Asvad orasida',
  uz_cyr: 'Рукни Ямоний билан Ҳажарул Асвад орасида',
  ru: 'Между Йеменским углом и Чёрным камнем',
};

const circuitTitle = (n) => ({
  en: `Du‘a of circuit ${n}`,
  uz_latin: `${n}-aylanish duosi`,
  uz_cyr: `${n}-айланиш дуоси`,
  ru: `Дуа ${n}-го круга`,
});

const REF = {
  'Қозийхон': { en: 'Fatawa Qadikhan', ru: 'Фатава Казыхан' },
  'Фатавои Қозихон': { en: 'Fatawa Qadikhan', ru: 'Фатава Казыхан' },
  'Фатавои қозихон': { en: 'Fatawa Qadikhan', ru: 'Фатава Казыхан' },
  'Китаби манаасик': { en: 'Kitab al-Manasik', ru: 'Китаб аль-Манасик' },
  'Китоби манаасик': { en: 'Kitab al-Manasik', ru: 'Китаб аль-Манасик' },
  'Табйийнул ҳақоиқ': { en: 'Tabyin al-Haqaiq', ru: 'Табйин аль-Хакаик' },
  'Мароқил фалоҳ': { en: 'Maraqi al-Falah', ru: 'Мараки аль-Фалях' },
  'Ғуниятун носик': { en: 'Ghunyat al-Nasik', ru: 'Гунйат ан-Насик' },
  'Бақара сураси, 125-оят': { en: 'Surah al-Baqarah, 2:125', ru: 'Сура аль-Бакара, 2:125' },
};

const T = {
  T_ENTRY: {
    title: { en: 'On beginning the Tawaf', uz_latin: 'Tavofga kirishda', uz_cyr: 'Тавофга киришишда', ru: 'При начале тавафа' },
    en: {
      t: 'Bismillāhi Allāhu akbar wa lillāhi-l-ḥamd, waṣ-ṣalātu was-salāmu ʿalā Rasūlillāh. Allāhumma īmānan bika wa taṣdīqan bi-kitābika wa wafāʾan bi-ʿahdika wa-ttibāʿan li-sunnati nabiyyika Muḥammadin ṣalla-llāhu ʿalayhi wa sallam.',
      m: 'In the name of Allah I begin the Tawaf. Allah is the Greatest. Praise be to Allah. Blessings and peace be upon His Messenger. O Allah, (I begin the Tawaf) believing in You, affirming Your Book, fulfilling Your covenant and following the Sunnah of Your Prophet.',
    },
    ru: 'С именем Аллаха начинаю таваф. Аллах велик. Хвала Аллаху. Благословение и мир Его Посланнику. О Аллах, (начинаю таваф) веруя в Тебя, признавая истинность Твоей Книги, исполняя завет с Тобой и следуя Сунне Твоего Пророка.',
  },
  T_SHORT: {
    title: {
      en: 'Short form — also at the start of each circuit',
      uz_latin: 'Qisqa varianti — har aylanish boshida ham',
      uz_cyr: 'Қисқа варианти — ҳар айланиш бошида ҳам',
      ru: 'Краткий вариант — также в начале каждого круга',
    },
    en: { t: 'Bismillāhi Allāhu akbar wa lillāhi-l-ḥamd.', m: 'In the name of Allah. Allah is the Greatest, and praise be to Allah.' },
    ru: 'С именем Аллаха. Аллах велик, и хвала Аллаху.',
    // The content file gives no meaning for the short form.
    uzCyrMeaning: 'Аллоҳ номи билан. Аллоҳ улуғдир, Аллоҳга ҳамд бўлсин.',
  },
  C1: {
    title: circuitTitle(1),
    en: {
      t: 'Subḥāna-llāh, wal-ḥamdu lillāh, wa lā ilāha illa-llāh, wa-llāhu akbar, wa lā ḥawla wa lā quwwata illā billāhi-l-ʿaliyyi-l-ʿaẓīm. Waṣ-ṣalātu was-salāmu ʿalā Rasūlillāhi ṣalla-llāhu ʿalayhi wa sallam. Allāhumma īmānan bika wa taṣdīqan bi-kalimātika wa wafāʾan bi-ʿahdika wa-ttibāʿan li-sunnati nabiyyika wa ḥabībika sayyidinā Muḥammadin ṣalla-llāhu ʿalayhi wa sallam. Allāhumma innī asʾaluka-l-ʿafwa wal-ʿāfiyata wal-muʿāfāta-d-dāʾimata fi-d-dīni wa-d-dunyā wal-ākhirah, wal-fawza bil-jannati wan-najāta mina-n-nār.',
      m: 'Allah is free of every fault and imperfection. All praise belongs to Allah. There is no god but Allah. Allah is the Greatest. The strength to obey and the strength to keep away from sin come only from Allah, the Most High, the Most Great. Blessings and peace be upon the Messenger of Allah ﷺ. O Allah, (I perform the Tawaf) believing in You, affirming Your Book, fulfilling Your covenant and following the Sunnah of Your Prophet. O Allah, I ask You for pardon and well-being, lasting forgiveness in religion, this world and the Hereafter, attaining Paradise and salvation from the Fire.',
    },
    ru: 'Аллах свободен от всех недостатков. Вся хвала принадлежит Аллаху. Нет божества, кроме Аллаха. Аллах велик. Сила к покорности и сила удержаться от греха — только от Аллаха, Всевышнего, Великого. Благословение и мир Посланнику Аллаха ﷺ. О Аллах, (совершаю таваф) веруя в Тебя, признавая истинность Твоей Книги, исполняя завет с Тобой и следуя Сунне Твоего Пророка. О Аллах, прошу у Тебя прощения и благополучия, вечного прощения в религии, в этом мире и в вечной жизни, обретения Рая и спасения от Огня.',
  },
  C2: {
    title: circuitTitle(2),
    en: {
      t: 'Allāhumma inna hādha-l-bayta baytuka, wal-ḥarama ḥaramuka, wal-amna amnuka, wal-ʿabda ʿabduka, wa ana ʿabduka wa-bnu ʿabdika, wa hādhā maqāmu-l-ʿāʾidhi bika mina-n-nār, wa ḥarrim luḥūmanā wa basharatanā ʿala-n-nār. Allāhumma ḥabbib ilayna-l-īmāna wa zayyinhu fī qulūbinā, wa karrih ilayna-l-kufra wal-fusūqa wal-ʿiṣyān, wajʿalnā mina-r-rāshidīn. Allāhumma qinī ʿadhābaka yawma tabʿathu ʿibādak. Allāhumma-rzuqniya-l-jannata bi-ghayri ḥisāb.',
      m: 'O Allah, this House is Your House, and the Sanctuary is Your Sanctuary. The safety here is the safety You established. The servant is Your servant, and I am Your servant and the son of Your servant. This is the place of one who seeks refuge in You from the Fire. Make our flesh and our skin forbidden to the Fire. O Allah, make faith beloved to us and beautify it in our hearts; make disbelief, wickedness and sin hateful to us, and place us among the rightly guided.',
    },
    ru: 'О Аллах, этот Дом — Твой Дом, а заповедная территория — Твоя. Безопасность здесь установил Ты. Раб — Твой раб, и я Твой раб и сын Твоего раба. Это место того, кто ищет у Тебя защиты от Огня. Сделай нашу плоть и нашу кожу запретными для Огня. О Аллах, сделай веру любимой для нас и укрась её в наших сердцах, сделай ненавистными для нас неверие, нечестие и грех и включи нас в число идущих прямым путём.',
  },
  C3: {
    title: circuitTitle(3),
    en: {
      t: 'Allāhumma innī aʿūdhu bika mina-sh-shakki wa-sh-shirki wa-n-nifāqi wa-sh-shiqāqi wa sūʾi-l-akhlāq, wa sūʾi-l-manẓari wal-munqalabi fi-l-māli wal-ahli wal-walad. Allāhumma innī aʿūdhu bika min fitnati-l-qabr, wa aʿūdhu bika min fitnati-l-maḥyā wal-mamāt, wa aʿūdhu bika mina-l-khizyi fi-d-dunyā wal-ākhirah.',
      m: 'O Allah, I seek refuge in You from doubt, from associating partners with You, from opposing Your command, from hypocrisy, from bad character, and from an evil sight when I return to my wealth, my family and my children. O Allah, I seek refuge in You from the trial of the grave, from the trials of life and death, and from disgrace in this world and the Hereafter.',
    },
    ru: 'О Аллах, прибегаю к Твоей защите от сомнения, от многобожия, от противления Твоему велению, от лицемерия, от дурного нрава и от печального зрелища по возвращении к моему имуществу, семье и детям. О Аллах, прибегаю к Твоей защите от испытания могилы, от испытаний жизни и смерти и от позора в этом мире и в вечной жизни.',
  },
  C4: {
    title: circuitTitle(4),
    en: {
      t: 'Allāhumma-jʿalhu ḥajjan mabrūran, wa saʿyan mashkūran, wa dhanban maghfūran, wa ʿamalan ṣāliḥan maqbūlan, wa tijāratan lan tabūr. Yā ʿālima mā fi-ṣ-ṣudūr, akhrijnī yā Allāhu mina-ẓ-ẓulumāti ila-n-nūr. Allāhumma innī asʾaluka mūjibāti raḥmatik, wa ʿazāʾima maghfiratik, wal-ghanīmata min kulli birr, wa-s-salāmata min kulli ithm, wal-fawza bil-jannati wan-najāta mina-n-nār. Rabbi qanniʿnī bimā razaqtanī, wa bārik lī fīmā aʿṭaytanī, wakhluf ʿalā kulli ghāʾibatin lī minka bi-khayr.',
      m: 'O Allah, make this an accepted Hajj, my striving rewarded and my sins forgiven; make my deeds righteous and accepted, a trade that never fails. O Knower of what is in the hearts! O Allah, bring me out of the darkness into the light. O Allah, I ask You for what makes Your mercy due and what brings Your forgiveness, for safety from every sin, a share of every good, attaining Paradise and salvation from the Fire. My Lord, make me content with what You have provided me and bless me in what You have given me. Be the Guardian of everything of mine that is absent from me.',
    },
    ru: 'О Аллах, сделай этот хадж принятым, мои усилия — вознаграждёнными, мои грехи — прощёнными, мои дела — праведными и принятыми, торговлей, которая не знает убытка. О Знающий то, что в сердцах! О Аллах, выведи меня из мрака к свету. О Аллах, прошу у Тебя того, что делает Твою милость обязательной и ведёт к Твоему прощению, избавления от всякого греха, доли во всяком благе, обретения Рая и спасения от Огня. Господи, сделай меня довольным тем, чем Ты наделил меня, и благослови меня в том, что Ты дал мне. Будь Хранителем всего моего, что вдали от меня.',
  },
  C5: {
    title: circuitTitle(5),
    en: {
      t: 'Allāhumma aẓillanī taḥta ẓilli ʿarshika yawma lā ẓilla illā ẓillu ʿarshik, wa lā bāqiya illā wajhuk, wasqinī min ḥawḍi nabiyyika sayyidinā Muḥammadin ṣalla-llāhu ʿalayhi wa sallam sharbatan hanīʾatan marīʾatan lā naẓmaʾu baʿdahā abadā. Allāhumma innī asʾaluka min khayri mā saʾalaka minhu nabiyyuka sayyidunā Muḥammadun ṣalla-llāhu ʿalayhi wa sallam, wa aʿūdhu bika min sharri ma-staʿādha bika minhu nabiyyuka sayyidunā Muḥammadun ṣalla-llāhu ʿalayhi wa sallam, wa anta-l-mustaʿānu wa ʿalayka-l-balāgh, wa lā ḥawla wa lā quwwata illā billāh. Allāhumma innī asʾaluka-l-jannata wa naʿīmahā wa mā yuqarribunī ilayhā min qawlin aw fiʿlin aw ʿamal, wa aʿūdhu bika mina-n-nāri wa mā yuqarribunī ilayhā min qawlin aw fiʿlin aw ʿamal.',
      m: 'O Allah, shade me in the shade of Your Throne on the Day when there is no shade but the shade of Your Throne. None remains but You. Let me drink from the Pond (Kawthar) of Your Prophet, our master Muhammad ﷺ, a drink after which I will never thirst again. O Allah, I ask You for all the good that Your Prophet, our master Muhammad ﷺ, asked You for, and I seek refuge in You from the evil of everything from which Your Prophet, our master Muhammad ﷺ, sought refuge. You alone are the One whose help is sought and who suffices. There is no power to obey and no strength to keep away from sin except through Allah. O Allah, I ask You for Paradise and its delights, and for the words, acts and deeds that bring me near to it; and I seek refuge in You from the Fire and from the words, acts and deeds that bring me near to it.',
    },
    ru: 'О Аллах, укрой меня в тени Твоего Трона в День, когда не будет тени, кроме тени Твоего Трона. Вечен лишь Ты. Напои меня из водоёма (Каусар) Твоего Пророка, нашего господина Мухаммада ﷺ, так, чтобы я больше никогда не испытал жажды. О Аллах, прошу у Тебя всего блага, о котором просил Тебя Твой Пророк, наш господин Мухаммад ﷺ, и прибегаю к Твоей защите от зла всего, от чего искал защиты Твой Пророк, наш господин Мухаммад ﷺ. Лишь у Тебя просят помощи, и лишь Ты достаточен. Сила к покорности и сила удержаться от греха — только от Аллаха. О Аллах, прошу у Тебя Рая и его благ и слов, поступков и дел, приближающих к нему, и прибегаю к Твоей защите от Огня и от слов, поступков и дел, приближающих к нему.',
  },
  C6: {
    title: circuitTitle(6),
    en: {
      t: 'Allāhumma inna laka ʿalayya ḥuqūqan kathīratan fīmā baynī wa baynak, wa ḥuqūqan kathīratan fīmā baynī wa bayna khalqik. Allāhumma mā kāna laka minhā faghfirhu lī, wa mā kāna li-khalqika fataḥammalhu ʿannī, wa aghninī bi-ḥalālika ʿan ḥarāmik, wa bi-ṭāʿatika ʿan maʿṣiyatik, wa bi-faḍlika ʿamman siwāk, yā wāsiʿa-l-maghfirah. Allāhumma inna baytaka ʿaẓīm, wa wajhaka karīm, wa anta yā Allāhu ḥalīmun karīmun ʿaẓīm, tuḥibbu-l-ʿafwa faʿfu ʿannī.',
      m: 'O Allah, You have many rights over me in what is between You and me, and there are many rights in what is between me and Your creation. O Allah, forgive me what of them is due to You, and take upon Yourself what is due to Your creation. By Your lawful make me free of need of Your unlawful, by obedience to You free of disobeying You, and by Your bounty free of anyone besides You, O You whose forgiveness is vast! O Allah, Your House is great and You are Noble. O Allah, You are Forbearing, Generous and Great. You love to pardon, so pardon me.',
    },
    ru: 'О Аллах, у Тебя есть передо мной множество прав в том, что между мной и Тобой, и множество прав в том, что между мной и Твоими творениями. О Аллах, прости мне то из них, что принадлежит Тебе, а то, что принадлежит Твоим творениям, возьми на Себя. Избавь меня Твоим дозволенным от нужды в запретном, покорностью Тебе — от ослушания Тебя, Твоей милостью — от нужды в ком-либо, кроме Тебя, о Обладающий обширным прощением! О Аллах, Твой Дом велик, и Ты Благороден. О Аллах, Ты — Кроткий, Щедрый, Великий. Ты любишь прощать — так прости меня.',
  },
  C7: {
    title: circuitTitle(7),
    en: {
      t: 'Allāhumma innī asʾaluka īmānan kāmilā, wa yaqīnan ṣādiqā, wa rizqan wāsiʿā, wa qalban khāshiʿā, wa lisānan dhākirā, wa ḥalālan ṭayyibā, wa tawbatan naṣūḥā, wa tawbatan qabla-l-mawt, wa maghfiratan wa raḥmatan baʿda-l-mawt, wal-ʿafwa ʿinda-l-ḥisāb, wal-fawza bil-jannati wan-najāta mina-n-nār, bi-raḥmatika yā ʿAzīzu yā Ghaffār. Rabbi zidnī ʿilman wa alḥiqnī biṣ-ṣāliḥīn.',
      m: 'O Allah, I ask You for perfect faith, true certainty, abundant provision, a humble heart, a tongue that remembers You, lawful and pure provision, sincere repentance, repentance before death, ease at the time of death, and forgiveness and mercy after death. I ask You for pardon at the Reckoning, and that by Your mercy I attain Paradise and am saved from the Fire. My Lord, increase me in knowledge and join me with the righteous.',
    },
    ru: 'О Аллах, прошу у Тебя совершенной веры, истинной убеждённости, широкого удела, смиренного сердца, языка, поминающего Тебя, дозволенного и чистого удела, искреннего покаяния, покаяния до смерти, облегчения в час смерти, прощения и милости после смерти. Прошу Тебя о прощении при расчёте и о том, чтобы по Твоей милости обрести Рай и спастись от Огня. Господи, приумножь моё знание и присоедини меня к праведникам.',
  },
  M1: {
    title: { en: 'At Maqam Ibrahim, before the two rak‘ahs', uz_latin: 'Maqomi Ibrohimda, namozdan oldin', uz_cyr: 'Мақоми Иброҳимда, намоздан олдин', ru: 'У Макама Ибрахима, перед двумя ракаатами' },
    en: { t: 'Wattakhidhū min maqāmi Ibrāhīma muṣallā.', m: 'Take the Station of Ibrahim as a place of prayer.' },
    ru: 'Сделайте место стояния Ибрахима местом молитвы.',
  },
  M2: {
    title: {
      en: 'After the two rak‘ahs — the du‘a of Adam (peace be upon him)',
      uz_latin: 'Ikki rakatdan keyin — Odam alayhissalom duosi',
      uz_cyr: 'Икки ракатдан кейин — Одам алайҳиссалом дуоси',
      ru: 'После двух ракаатов — дуа Адама (мир ему)',
    },
    en: {
      t: 'Allāhumma innaka taʿlamu sirrī wa ʿalāniyatī faqbal maʿdhiratī, wa taʿlamu ḥājatī faʾaʿṭinī suʾlī, wa taʿlamu mā fī nafsī faghfir lī dhunūbī. Allāhumma innī asʾaluka īmānan yubāshiru qalbī, wa yaqīnan ṣādiqan ḥattā aʿlama annahu lā yuṣībunī illā mā katabta lī, wa riḍan bimā qassamta lī, yā arḥama-r-rāḥimīn.',
      m: 'O Allah, You know well what I hide and what I show, so accept my excuse. You know my need, so grant what I ask. You know what is in my soul, so forgive my sins. O Allah, I ask You for faith that fills my heart and true certainty, so that I know nothing reaches me except what You have written for me, and contentment with what You have allotted me, O Most Merciful of the merciful!',
    },
    ru: 'О Аллах, Ты хорошо знаешь моё тайное и явное — прими же моё оправдание. Ты знаешь мою нужду — дай же мне то, о чём прошу. Ты знаешь то, что в моей душе, — прости же мои грехи. О Аллах, прошу у Тебя веры, наполняющей моё сердце, и истинной убеждённости, чтобы я знал, что меня постигнет лишь то, что Ты предписал мне, и довольства тем, что Ты мне уделил, о Милосерднейший из милосердных!',
  },
  M3: {
    title: { en: 'At the Multazam', uz_latin: 'Multazamda', uz_cyr: 'Мултазамда', ru: 'У Мультазама' },
    en: {
      t: 'Allāhumma inna hādhā baytuka-lladhī jaʿaltahu mubārakan wa hudan lil-ʿālamīn. Allāhumma kamā hadaytanī lahu fataqabbal minnī, wa lā tajʿal hādhā ākhira-l-ʿahdi min baytik, warzuqni-l-ʿawda ilayhi ḥattā tarḍā ʿannī, bi-raḥmatika yā arḥama-r-rāḥimīn.',
      m: 'O Allah, this is the House that You made blessed and a guidance for the worlds. O Allah, as You guided me to visit this House, accept my visit from me. Do not make this journey to Your House my last; by Your mercy grant me to return to it again and again until You are pleased with me, O Most Merciful of the merciful!',
    },
    ru: 'О Аллах, это Дом, который Ты сделал благословенным и руководством для миров. О Аллах, как Ты привёл меня к посещению этого Дома, так прими от меня моё посещение. Не делай это путешествие к Твоему Дому последним, по Твоей милости даруй мне возвращаться к нему снова и снова, пока Ты не будешь доволен мной, о Милосерднейший из милосердных!',
  },
  M4: {
    title: { en: 'Under the Rain Spout of Mercy (Mizab)', uz_latin: 'Rahmat tarnovi ostida', uz_cyr: 'Раҳмат тарнови остида', ru: 'Под Желобом милости' },
    en: {
      t: 'Allāhumma innī asʾaluka īmānan lā yazūlu, wa yaqīnan lā yanfadu, wa murāfaqata nabiyyika Muḥammadin ṣalla-llāhu ʿalayhi wa sallam. Allāhumma aẓillanī taḥta ẓilli ʿarshika yawma lā ẓilla illā ẓillu ʿarshik, wasqinī bi-kaʾsi Muḥammadin ṣalla-llāhu ʿalayhi wa sallam sharbatan lā aẓmaʾu baʿdahā abadā.',
      m: 'O Allah, I ask You for faith that does not fade, certainty that does not run out, and companionship with Your Prophet Muhammad ﷺ. O Allah, shade me under the shade of Your Throne on the Day when there is no shade but the shade of Your Throne, and let me drink from the cup of Muhammad ﷺ a drink after which I will never thirst again.',
    },
    ru: 'О Аллах, прошу у Тебя неисчезающей веры, неиссякаемой убеждённости и соседства с Твоим Пророком Мухаммадом ﷺ. О Аллах, укрой меня в тени Твоего Трона в День, когда не будет тени, кроме тени Твоего Трона, и напои меня из чаши Мухаммада ﷺ так, чтобы я больше никогда не испытал жажды.',
  },
  Z1: {
    title: { en: 'While drinking Zamzam', uz_latin: 'Zamzam suvini ichayotganda', uz_cyr: 'Замзам сувини ичаётганда', ru: 'Когда пьёте Замзам' },
    en: { t: 'Allāhumma innī asʾaluka ʿilman nāfiʿā, wa rizqan wāsiʿā, wa shifāʾan min kulli dāʾ.', m: 'O Allah, I ask You for beneficial knowledge, abundant provision and healing from every illness.' },
    ru: 'О Аллах, прошу у Тебя полезного знания, широкого удела и исцеления от всякой болезни.',
  },
  S1: {
    title: { en: 'On leaving Masjid al-Haram', uz_latin: 'Masjidul Haromdan chiqishda', uz_cyr: 'Масжидул Ҳаромдан чиқишда', ru: 'При выходе из Масджид аль-Харам' },
    en: { t: 'Bismillāh, waṣ-ṣalātu was-salāmu ʿalā Rasūlillāh. Allāhumma-ghfir lī dhunūbī waftaḥ lī abwāba faḍlik.', m: 'In the name of Allah (I leave the mosque). Blessings and peace be upon the Messenger of Allah. O Allah, forgive my sins and open for me the gates of Your bounty and mercy.' },
    ru: 'С именем Аллаха (выхожу из мечети). Благословение и мир Посланнику Аллаха. О Аллах, прости мои грехи и открой мне врата Твоей щедрости и милости.',
  },
  S2: {
    title: { en: 'While climbing Safa', uz_latin: 'Safo tog‘iga ko‘tarilayotganda', uz_cyr: 'Сафо тоғига кўтарилаётганда', ru: 'При подъёме на Сафа' },
    en: { t: 'Bismillāh, abdaʾu bimā badaʾa-llāhu bih. Inna-ṣ-ṣafā wal-marwata min shaʿāʾiri-llāh.', m: 'In the name of Allah, I begin with what Allah began with: “Safa and Marwah are among the symbols of Allah” (that is, I begin the Sa‘i from Safa).' },
    ru: 'С именем Аллаха начинаю с того, с чего начал Аллах: «Сафа и Марва — из обрядовых знамений Аллаха» (то есть начинаю сай с Сафы).',
  },
  S3: {
    title: { en: 'On Safa (three times), and again on Marwah', uz_latin: 'Safoda (uch marta) va Marvada', uz_cyr: 'Сафода (уч марта) ва Марвада', ru: 'На Сафе (трижды) и на Марве' },
    en: { t: 'Lā ilāha illa-llāhu waḥdahu lā sharīka lah, lahu-l-mulku wa lahu-l-ḥamd, yuḥyī wa yumīt, wa huwa ʿalā kulli shayʾin qadīr. Lā ilāha illa-llāhu waḥdah, anjaza waʿdah, wa naṣara ʿabdah, wa hazama-l-aḥzāba waḥdah.', m: 'There is no god but Allah alone; He has no partner. To Him belong the dominion and all praise. He gives life and causes death, and He has power over all things. There is no god but Allah alone. He fulfilled His promise, helped His servant and alone defeated the enemy.' },
    ru: 'Нет божества, кроме одного Аллаха, у Него нет сотоварища. Ему принадлежат власть и хвала. Он оживляет и умерщвляет, и Он властен над всякой вещью. Нет божества, кроме одного Аллаха. Он исполнил Своё обещание, помог Своему рабу и один разбил врагов.',
  },
  S4: {
    title: { en: 'Between the two green markers', uz_latin: 'Ikki yashil chiziq orasida', uz_cyr: 'Икки яшил чизиқ орасида', ru: 'Между двумя зелёными отметками' },
    en: { t: 'Rabbi-ghfir warḥam, wa tajāwaz ʿammā taʿlam, innaka anta-l-aʿazzu-l-akram.', m: 'My Lord, forgive me and have mercy on me, and pass over the sins You know of me. You are the Mighty, the Most Generous.' },
    ru: 'Господи, прости меня и помилуй и прости грехи, о которых Ты знаешь. Ты — Всемогущий, Обладатель щедрости.',
  },
  S5: {
    title: { en: 'After the green markers, on the way to Marwah', uz_latin: 'Yashil chiziqdan o‘tib, Marvaga ketayotganda', uz_cyr: 'Яшил чизиқдан ўтиб, Марвага кетаётганда', ru: 'После зелёных отметок, по пути к Марве' },
    en: { t: 'Allāhumma-staʿmilnī bi-sunnati nabiyyika wa tawaffanī ʿalā millatih, wa aʿidhnī min muḍillāti-l-fitan, bi-raḥmatika yā arḥama-r-rāḥimīn.', m: 'O Allah, make me one who acts by the Sunnah of Your Prophet, and by Your mercy grant me to die upon his religion. By Your mercy protect me from trials that lead astray, O Most Merciful of the merciful!' },
    ru: 'О Аллах, сделай меня следующим Сунне Твоего Пророка и по Твоей милости даруй мне умереть на его религии. По Твоей милости защити меня от вводящих в заблуждение смут, о Милосерднейший из милосердных!',
  },
  H1: {
    title: { en: 'While the hair is shaved or trimmed', uz_latin: 'Soch oldirayotganda', uz_cyr: 'Соч олдираётганда', ru: 'Во время бритья или стрижки волос' },
    en: { t: 'Allāhumma bārik fī nafsī waghfir lī dhunūbī, wajʿal lī bi-kulli shaʿratin minhā nūran yawma-l-qiyāmah.', m: 'O Allah, bless me and forgive my sins. Make every strand of my hair a light for me on the Day of Resurrection.' },
    ru: 'О Аллах, благослови меня и прости мои грехи. Сделай каждый мой волос светом для меня в День воскресения.',
  },
};

// Du'as that are in the database today but not in the content files. Text from
// 060_seed_rituals_umrah (step du'a), except where its English didn't match
// the Arabic (Ihram, Talbiyah) — fixed here, the step itself is unchanged.
const LEGACY = {
  0: {
    title: { en: 'On entering the mosque', uz_latin: 'Masjidga kirishda', uz_cyr: 'Масжидга киришда', ru: 'При входе в мечеть' },
    en: { t: 'Allāhumma-ftaḥ lī abwāba raḥmatik.', m: 'O Allah, open for me the gates of Your mercy.' },
  },
  1: {
    title: { en: 'Talbiyah', uz_latin: 'Talbiya', uz_cyr: 'Талбия', ru: 'Тальбия' },
    en: { t: 'Labbayka-llāhumma labbayk.', m: 'Here I am, O Allah, here I am.' },
  },
  6: {
    title: { en: 'For those who shave their heads', uz_latin: 'Soch oldirganlar uchun', uz_cyr: 'Соч олдирганлар учун', ru: 'За тех, кто бреет голову' },
  },
  7: {
    title: { en: 'On completing the Umrah', uz_latin: 'Umrani yakunlaganda', uz_cyr: 'Умрани якунлаганда', ru: 'По завершении Умры' },
  },
};

// Note on every Tawaf circuit (from the content's "Кўрсатма"), followed by the
// circuit's existing note where it had one.
const CIRCUIT_NOTE = {
  en: 'Finish this du‘a before the Yemeni Corner; between the Yemeni Corner and the Black Stone a separate du‘a is recited.',
  uz_latin: 'Bu duoni Rukni Yamoniyga yetguncha tugating. Rukni Yamoniy bilan Hajarul Asvad orasida alohida duo o‘qiladi.',
  uz_cyr: 'Бу дуони Рукни Ямонийга етгунча тугатинг. Рукни Ямоний билан Ҳажарул Асвад орасида алоҳида дуо ўқилади.',
  ru: 'Закончите это дуа до Йеменского угла; между Йеменским углом и Чёрным камнем читается отдельное дуа.',
};

module.exports = { T, Y_EN, Y_RU, Y_TITLE, REF, LEGACY, CIRCUIT_NOTE };
