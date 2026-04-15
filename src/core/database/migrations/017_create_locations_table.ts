import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable();
    table.string('nameAr', 255).notNullable();
    table.text('description').nullable();
    table.string('emoji', 10).nullable();
    table.json('coords').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by_id').nullable();
    table.boolean('is_deleted').defaultTo(false);
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTable('locations');
};
