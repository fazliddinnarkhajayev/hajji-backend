import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.table('invitations', (table) => {
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by_id').nullable();
    table.foreign('deleted_by_id').references('users.id').onDelete('SET NULL');
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.table('invitations', (table) => {
    table.dropForeign(['deleted_by_id']);
    table.dropColumn('deleted_by_id');
    table.dropColumn('deleted_at');
    table.dropColumn('is_deleted');
  });
};
