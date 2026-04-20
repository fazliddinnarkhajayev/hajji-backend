import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.table('invitations', (table) => {
    // Drop the foreign key constraint first
    table.dropForeign(['invited_by']);
    // Rename the column
    table.renameColumn('invited_by', 'created_by_id');
    // Add the foreign key back with the new column name
    table.foreign('created_by_id').references('users.id').onDelete('CASCADE');
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.table('invitations', (table) => {
    // Drop the foreign key constraint
    table.dropForeign(['created_by_id']);
    // Rename the column back
    table.renameColumn('created_by_id', 'invited_by');
    // Add the foreign key back
    table.foreign('invited_by').references('users.id').onDelete('CASCADE');
  });
};
