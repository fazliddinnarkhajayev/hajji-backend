import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('group_plans', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('group_id').notNullable();
    table.uuid('agency_id').notNullable();
    table.string('name').notNullable();
    table.integer('total_days').notNullable();
    table.text('description').nullable();
    table.string('status').notNullable().defaultTo('DRAFT'); // DRAFT | ACTIVE
    table.uuid('created_by_id').nullable();
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('group_id').references('groups.id').onDelete('CASCADE');
    table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    table.index('group_id');
    table.index('agency_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('group_plans');
};
