import type { Knex } from 'knex';

/** Per-language text for a ritual sub-step, one row per (substep, lang). */
exports.up = async function (knex: Knex) {
  const has = await knex.schema.hasTable('ritual_substep_translations');
  if (has) return;
  return knex.schema.createTable('ritual_substep_translations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('substep_id').notNullable();
    table.string('lang', 16).notNullable(); // en | ru | uz_latin | uz_cyr
    table.string('title', 255).nullable();
    table.text('instructions').nullable();
    table.text('dua_transliteration').nullable();
    table.text('dua_translation').nullable();
    table.text('note').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('substep_id').references('ritual_substeps.id').onDelete('CASCADE');
    table.unique(['substep_id', 'lang']);
    table.index('substep_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('ritual_substep_translations');
};
