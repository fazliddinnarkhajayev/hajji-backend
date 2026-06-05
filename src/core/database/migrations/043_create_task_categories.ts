import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('task_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('agency_id').notNullable();
    table.string('name').notNullable();
    table.string('icon').notNullable().defaultTo('📋');
    table.string('color').notNullable().defaultTo('#6366f1');
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    table.index('agency_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('task_categories');
};
