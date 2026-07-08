import type { Knex } from 'knex';

/** Per-language text for a ritual step, one row per (ritual, lang). */
exports.up = async function (knex: Knex) {
  const has = await knex.schema.hasTable('ritual_translations');
  if (has) return;
  return knex.schema.createTable('ritual_translations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ritual_id').notNullable();
    table.string('lang', 16).notNullable(); // en | ru | uz_latin | uz_cyr
    table.string('name', 255).nullable();
    table.text('description').nullable();
    table.string('location', 255).nullable();
    table.string('duration', 100).nullable();
    table.text('instructions').nullable();
    table.text('dua_transliteration').nullable();
    table.text('dua_translation').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('ritual_id').references('rituals.id').onDelete('CASCADE');
    table.unique(['ritual_id', 'lang']);
    table.index('ritual_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('ritual_translations');
};
