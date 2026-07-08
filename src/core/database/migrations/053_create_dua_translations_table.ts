import type { Knex } from 'knex';

/**
 * Per-language text for duas. Language-neutral fields (arabic, category,
 * reference, audio_url) stay on the `duas` table; everything a pilgrim reads
 * in their own language lives here, one row per (dua, lang).
 *
 * Existing single-language duas are backfilled into an `en` translation row.
 */
exports.up = async function (knex: Knex) {
  const has = await knex.schema.hasTable('dua_translations');
  if (!has) {
    await knex.schema.createTable('dua_translations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('dua_id').notNullable();
      table.string('lang', 16).notNullable(); // en | ru | uz_latin | uz_cyr
      table.string('title', 255).nullable();
      table.text('situation').nullable();
      table.text('transliteration').nullable();
      table.text('translation').nullable();
      table.text('context').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('dua_id').references('duas.id').onDelete('CASCADE');
      table.unique(['dua_id', 'lang']);
      table.index('dua_id');
    });
  }

  // Backfill existing duas (seeded in English) into an `en` translation row.
  const duas = await knex('duas').select(
    'id',
    'title',
    'transliteration',
    'translation',
    'virtue',
  );
  for (const d of duas) {
    const exists = await knex('dua_translations')
      .where({ dua_id: d.id, lang: 'en' })
      .first();
    if (!exists) {
      await knex('dua_translations').insert({
        dua_id: d.id,
        lang: 'en',
        title: d.title ?? null,
        transliteration: d.transliteration ?? null,
        translation: d.translation ?? null,
        context: d.virtue ?? null,
      });
    }
  }
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('dua_translations');
};
