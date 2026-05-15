import type { Knex } from 'knex';

const duas = [
  {
    title: 'Talbiyah',
    category: 'tawaf',
    arabic: 'لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ',
    transliteration: "Labbayka Allāhumma Labbayk. Labbayka Lā Sharīka Laka Labbayk. Inna al-Ḥamda Wa n-Ni'mata Laka Wal-Mulk. Lā Sharīka Lak.",
    translation: 'Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise and blessings are Yours, and all sovereignty. You have no partner.',
    reference: 'Sahih Bukhari & Muslim',
    virtue: 'The Talbiyah is the essence of Hajj and Umrah. It is a declaration of monotheism and submission to Allah.',
  },
  {
    title: 'Entering Masjid al-Haram',
    category: 'general',
    arabic: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ',
    transliteration: 'Allāhumma-ftaḥ lī abwāba raḥmatik',
    translation: 'O Allah, open for me the gates of Your mercy.',
    reference: 'Sahih Muslim',
    virtue: 'This dua is recommended to be recited when entering any mosque, especially the sacred mosques.',
  },
  {
    title: 'Beginning Tawaf',
    category: 'tawaf',
    arabic: 'بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ',
    transliteration: 'Bismillāhi wallāhu Akbar',
    translation: 'In the name of Allah, Allah is the Greatest.',
    reference: null,
    virtue: 'Recited at the start of each circuit of Tawaf, beginning from the Black Stone.',
  },
  {
    title: "Dua at Safa and Marwah",
    category: 'sai',
    arabic: 'إِنَّ الصَّفَا وَالْمَرْوَةَ مِنْ شَعَائِرِ اللَّهِ',
    transliteration: "Innas-Ṣafā Wal-Marwata Min Sha'ā'irillāh",
    translation: 'Indeed, Safa and Marwah are among the symbols of Allah.',
    reference: 'Quran 2:158',
    virtue: "Recited when beginning Sa'i at Safa, facing the Kaaba. It is a Quranic verse commemorating Hajar's search for water.",
  },
];

exports.up = async function (knex: Knex) {
  await knex('duas').insert(duas);
};

exports.down = async function (knex: Knex) {
  await knex('duas').whereIn('title', duas.map((d) => d.title)).delete();
};
