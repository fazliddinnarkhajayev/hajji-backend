import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('task_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('task_id').notNullable();
    // agency_users.id of whoever performed the action.
    table.uuid('actor_id').notNullable();
    // CREATED, STARTED, FLAGGED, CANCELLED_ON_PROBLEM, CONTINUE_APPROVED,
    // RESUMED, COMPLETED, CANCELLED, REASSIGNED, CLOSED.
    table.string('action').notNullable();
    table.text('comment').nullable();
    table.string('from_status').nullable();
    table.string('to_status').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('task_id').references('tasks.id').onDelete('CASCADE');
    table.foreign('actor_id').references('agency_users.id');
    table.index(['task_id', 'created_at']);
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('task_activity_log');
};
