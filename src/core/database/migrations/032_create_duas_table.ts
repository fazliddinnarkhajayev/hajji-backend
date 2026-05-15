import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.createTable('duas', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.string('category', 100).notNullable();
    table.text('arabic').notNullable();
    table.text('transliteration').nullable();
    table.text('translation').nullable();
    table.string('reference', 255).nullable();
    table.text('virtue').nullable();
    table.string('audio_url', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by_id').nullable();
    table.boolean('is_deleted').defaultTo(false);
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTable('duas');
};
