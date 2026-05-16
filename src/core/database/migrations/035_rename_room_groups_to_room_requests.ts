import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.renameTable('room_groups', 'room_requests');
  await knex.schema.renameTable('room_group_members', 'room_request_members');
  await knex.schema.alterTable('room_request_members', (table) => {
    table.renameColumn('room_group_id', 'room_request_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.alterTable('room_request_members', (table) => {
    table.renameColumn('room_request_id', 'room_group_id');
  });
  await knex.schema.renameTable('room_request_members', 'room_group_members');
  await knex.schema.renameTable('room_requests', 'room_groups');
};
