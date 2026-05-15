import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.alterTable('duas', (table) => {
    table.datetime('deleted_at').nullable();
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.alterTable('duas', (table) => {
    table.dropColumn('deleted_at');
  });
};
