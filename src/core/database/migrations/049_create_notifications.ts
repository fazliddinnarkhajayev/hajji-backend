import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('notifications', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    // Core users.id (not agency_users.id / pilgrims.id) — matches what
    // WebSocketService.broadcastToUser expects everywhere else in the app.
    table.uuid('user_id').notNullable();
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.text('message').nullable();
    // Optional deep-link target for tap-to-navigate (e.g. screen:'taskDetail', id:<task id>).
    table.string('link_screen').nullable();
    table.string('link_id').nullable();
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index(['user_id', 'is_read']);
    table.index(['user_id', 'created_at']);
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('notifications');
};
