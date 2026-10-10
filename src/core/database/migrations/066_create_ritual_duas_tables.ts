import type { Knex } from 'knex';

// Du'as of a ritual step, in order — a step (or a Tawaf circuit) can have
// several (Sa'y: leaving the mosque, climbing Safa, on Safa, between the green
// markers, …). `substep_id` set = the du'a belongs to that circuit.
// The single-du'a columns on rituals / ritual_substeps stay as they are.
exports.up = async function (knex: Knex) {
  await knex.schema.createTable('ritual_duas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ritual_id').notNullable();
    table.uuid('substep_id').nullable();
    table.integer('sort_order').notNullable().defaultTo(0); // order within the step / circuit
    table.text('dua_arabic').notNullable();
    table.string('audio_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by_id').nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.foreign('ritual_id').references('rituals.id').onDelete('CASCADE');
    table.foreign('substep_id').references('ritual_substeps.id').onDelete('CASCADE');
    table.index(['ritual_id', 'substep_id', 'sort_order']);
  });

  await knex.schema.createTable('ritual_dua_translations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('dua_id').notNullable();
    table.string('lang', 16).notNullable(); // en | ru | uz_latin | uz_cyr
    table.string('title', 255).nullable(); // when it is recited, e.g. "Between the two green markers"
    table.text('transliteration').nullable();
    table.text('translation').nullable();
    table.string('reference', 255).nullable(); // source, e.g. "Fatawa Qadikhan"
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.foreign('dua_id').references('ritual_duas.id').onDelete('CASCADE');
    table.unique(['dua_id', 'lang']);
    table.index('dua_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('ritual_dua_translations');
  await knex.schema.dropTableIfExists('ritual_duas');
};
