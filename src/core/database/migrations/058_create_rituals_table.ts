import type { Knex } from 'knex';

/**
 * Ritual steps (Umrah / Hajj). Language-neutral fields live here; everything a
 * pilgrim reads in their own language lives in `ritual_translations`. Mirrors
 * the duas content model.
 */
exports.up = async function (knex: Knex) {
  return knex.schema.createTable('rituals', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('type', 20).notNullable().defaultTo('umrah'); // umrah | hajj
    table.integer('sort_order').notNullable().defaultTo(0);
    table.text('arabic').nullable();       // step Arabic name (e.g. الإحرام)
    table.text('dua_arabic').nullable();   // the Arabic du'a for this step
    table.string('audio_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by_id').nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at').nullable();

    table.index(['type', 'sort_order']);
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTable('rituals');
};
