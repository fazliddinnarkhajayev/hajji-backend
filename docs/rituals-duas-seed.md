# Ritual du'as: tables and Umrah reseed (066, 067)

Date: 2026-10-11. Source texts: `D:\hajji\content\*.docx`.

## Migrations

| File | What it does |
|---|---|
| `066_create_ritual_duas_tables.ts` | `ritual_duas` (ritual_id, substep_id nullable, sort_order, dua_arabic, audio_url, soft-delete columns) and `ritual_dua_translations` (dua_id, lang, title, transliteration, translation, reference; unique dua_id+lang). FKs cascade from `rituals` / `ritual_substeps`. |
| `067_seed_umrah_rituals_with_duas.ts` | **Replaces all Umrah ritual data**: deletes `rituals` where type = umrah (translations, substeps, du'as cascade) and inserts everything again. |

Run with `npm run db:migrate`. 067 deletes the old Umrah rows itself, so deleting them by hand first is optional. `down` of 067 removes the Umrah rituals; `down` of 066 drops the two tables.

## What 067 inserts

* **8 steps:** exactly as `060_seed_rituals_umrah`. The step du'a columns (`rituals.dua_arabic`, `ritual_translations.dua_*`) are unchanged.
* **7 Tawaf circuits:** titles and instructions from `063_seed_tawaf_substeps`.
  * Each circuit's du'a columns now hold that circuit's own du'a from the content; before, all 7 had «Rabbanā ātinā…».
  * Notes: every circuit now says to finish its du'a before the Yemeni Corner, where a separate du'a starts. Circuits 2 and 7 keep their old notes after that. Circuit 1's old note pointed at the old du'a and is replaced.
* **31 `ritual_duas`**, in order:

| Step | Du'as |
|---|---|
| 0 Ihram | entering the mosque (DB only, not in content) |
| 1 Talbiya | talbiyah (DB only) |
| 2 Tawaf | starting the Tawaf; short form «Bismillāhi Allāhu akbar wa lillāhi-l-ḥamd» |
| 2 Tawaf, circuits 1–7 | the circuit's du'a; the du'a between the Yemeni Corner and the Black Stone (2 per circuit) |
| 3 Two rak'ahs | Maqam ayah; Adam's du'a; Multazam; under the Rain Spout of Mercy |
| 4 Zamzam | while drinking |
| 5 Sa'y | leaving the mosque; climbing Safa; on Safa / Marwah; between the green markers; after them towards Marwah |
| 6 Halq | while shaving (from the Hajj file); «Allāhumma-ghfir lil-muḥalliqīn» (DB only) |
| 7 Completion | completion du'a (DB only) |

## Languages

* **uz_cyr:** the content text unchanged, except that:
  * the surrounding «» are dropped;
  * the source in parentheses is moved to `reference`;
  * footnote marks like `[3]` are removed from the Arabic.
* **uz_latin:** a letter-by-letter Latin conversion of the uz_cyr text.
* **en, ru:** translations of the content meaning.
  * en transliteration is written from the Arabic.
  * ru transliteration is the uz_cyr one with ҳ/қ/ғ/ў replaced by х/к/г/у.
* **Du'as that were only in the database:** their texts are taken from 060. The English for Ihram and Talbiyah did not match the Arabic and is corrected in `ritual_duas` only.

## Content issues kept as in the source

* **Circuit 6 Arabic:** has «حلقك» (for «خلقك») and «عن حرامك», while the transliteration says «ан роҳматика».
* **Circuit 2 meaning:** the content's meaning does not translate the last two sentences («qinī ʿadhābaka…», «arzuqnī-l-jannata…»). en and ru follow the content.
* **Circuit 7 meaning:** the content's meaning includes "ease at the time of death", which is not in the Arabic. en and ru follow the content.
* **Tawaf short form:** the content gives no meaning; the uz_cyr meaning was written for this seed.

## Not included

These are not Umrah steps:
* Arafat, Muzdalifa, Mina, Jamarat and sacrifice (Hajj);
* "at every blessed place", morning/evening du'a, Sayyid al-Istighfar, leaving Makkah.

## Regenerating

`scripts/rituals-duas/`:
1. `python -X utf8 docx_text.py <content>/*.docx > content_text.txt`
2. `node generate.js content_text.txt ../../src/core/database/migrations`

The generator expects the line layout of the current content files. en/ru texts and titles are in `translations.js`.

## Not done yet

* `/mobile/rituals` does not return `ritual_duas` yet.
* The app does not read `ritual_duas` yet.
* The app shows the new per-circuit du'as only after the content is downloaded again.
