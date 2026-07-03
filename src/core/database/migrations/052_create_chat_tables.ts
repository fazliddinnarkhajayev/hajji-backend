import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('chat_rooms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('agency_id').notNullable();
    table.string('type', 20).notNullable(); // 'dm' | 'group'
    // Nullable for 'dm' rooms — the frontend derives the display name from the
    // other member instead of storing it redundantly.
    table.string('name').nullable();
    table.uuid('created_by_user_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    table.foreign('created_by_user_id').references('users.id').onDelete('RESTRICT');
    table.index(['agency_id']);
  });

  await knex.schema.createTable('chat_room_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('room_id').notNullable();
    // Core users.id — matches WebSocketService.broadcastToUser's target
    // everywhere else in the app (see notifications table's user_id comment).
    table.uuid('user_id').notNullable();
    table.timestamp('last_read_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('room_id').references('chat_rooms.id').onDelete('CASCADE');
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.unique(['room_id', 'user_id']);
    table.index(['user_id']);
  });

  await knex.schema.createTable('chat_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('room_id').notNullable();
    table.uuid('sender_user_id').notNullable();
    table.string('kind', 20).notNullable(); // 'text' | 'file'
    table.text('text').nullable();
    table.string('file_url').nullable();
    table.string('file_name').nullable();
    table.string('file_size').nullable();
    table.uuid('reply_to_message_id').nullable();
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('room_id').references('chat_rooms.id').onDelete('CASCADE');
    table.foreign('sender_user_id').references('users.id').onDelete('RESTRICT');
    table.foreign('reply_to_message_id').references('chat_messages.id').onDelete('SET NULL');
    table.index(['room_id', 'created_at']);
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('chat_messages');
  await knex.schema.dropTableIfExists('chat_room_members');
  await knex.schema.dropTableIfExists('chat_rooms');
};
