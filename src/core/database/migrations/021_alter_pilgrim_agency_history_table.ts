import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.table('pilgrim_agency_history', (table) => {
    // Drop the old foreign key constraint
    table.dropForeign(['admin_id']);
    // Rename column from admin_id to user_id
    table.renameColumn('admin_id', 'user_id');
    // Add foreign key to users table
    table.foreign('user_id').references('users.id').onDelete('CASCADE');
  }).then(() => {
    // Drop and recreate action column separately to avoid constraint issues
    return knex.schema.table('pilgrim_agency_history', (table) => {
      table.dropColumn('action');
    });
  }).then(() => {
    return knex.schema.table('pilgrim_agency_history', (table) => {
      table.enum('action', ['SET', 'REMOVE']).notNullable();
    });
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.table('pilgrim_agency_history', (table) => {
    table.dropForeign(['user_id']);
    table.renameColumn('user_id', 'admin_id');
    table.foreign('admin_id').references('admins.id').onDelete('CASCADE');
  }).then(() => {
    return knex.schema.table('pilgrim_agency_history', (table) => {
      table.dropColumn('action');
    });
  }).then(() => {
    return knex.schema.table('pilgrim_agency_history', (table) => {
      table.text('action').notNullable();
    });
  });
};
