import type { Knex } from 'knex';

/**
 * Sub-steps of a ritual step — e.g. the 7 circuits (ashwat) of Tawaf or the 7
 * trips of Sa'i, where the instruction / du'a changes at each stage. Language-
 * neutral fields live here; per-language text lives in
 * `ritual_substep_translations`. Mirrors the rituals / ritual_translations model.
 */
exports.up = async function (knex: Knex) {
  const has = await knex.schema.hasTable('ritual_substeps');
  if (has) return;
  return knex.schema.createTable('ritual_substeps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('ritual_id').notNullable();
    table.integer('sort_order').notNullable().defaultTo(0); // 1..N (circuit index)
    table.text('dua_arabic').nullable();
    table.string('audio_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by_id').nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at').nullable();

    table.foreign('ritual_id').references('rituals.id').onDelete('CASCADE');
    table.index(['ritual_id', 'sort_order']);
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTableIfExists('ritual_substeps');
};
