import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.table('pilgrims', (table) => {
    table.uuid('agency_id').nullable();
    table.foreign('agency_id').references('agencies.id').onDelete('SET NULL');
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.table('pilgrims', (table) => {
    table.dropForeign('agency_id');
    table.dropColumn('agency_id');
  });
};
