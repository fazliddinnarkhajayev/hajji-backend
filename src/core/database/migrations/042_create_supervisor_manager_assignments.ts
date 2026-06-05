import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('supervisor_manager_assignments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('supervisor_id').notNullable();
    table.uuid('manager_id').notNullable();
    table.uuid('agency_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('supervisor_id').references('agency_users.id').onDelete('CASCADE');
    table.foreign('manager_id').references('agency_users.id').onDelete('CASCADE');
    table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    table.unique(['supervisor_id', 'manager_id']);
    table.index('supervisor_id');
    table.index('manager_id');
    table.index('agency_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('supervisor_manager_assignments');
};
