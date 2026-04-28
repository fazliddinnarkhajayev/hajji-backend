import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.alterTable('users', (table) => {
    table.string('language', 10).nullable();
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('language');
  });
};
