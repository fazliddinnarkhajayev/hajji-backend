import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('rooms', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('group_id').notNullable();
    table.string('name').notNullable();
    table.integer('capacity').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();

    table.foreign('group_id').references('groups.id').onDelete('CASCADE');
    table.index('group_id');
  });

  await knex.schema.createTable('room_members', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('room_id').notNullable();
    table.uuid('pilgrim_id').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('room_id').references('rooms.id').onDelete('CASCADE');
    table.foreign('pilgrim_id').references('pilgrims.id').onDelete('CASCADE');
    table.unique(['pilgrim_id']);
    table.index('room_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('room_members');
  await knex.schema.dropTableIfExists('rooms');
};
