import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.alterTable('regions', (table) => {
    table.uuid('country_id').nullable().references('id').inTable('countries');
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.alterTable('regions', (table) => {
    table.dropColumn('country_id');
  });
};
