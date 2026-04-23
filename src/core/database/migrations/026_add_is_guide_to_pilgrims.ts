import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  const hasColumn = await knex.schema.hasColumn('pilgrims', 'is_guide');
  if (!hasColumn) {
    return knex.schema.table('pilgrims', (table) => {
      table.boolean('is_guide').defaultTo(false);
    });
  }
};

exports.down = async function (knex: Knex) {
  return knex.schema.table('pilgrims', (table) => {
    table.dropColumn('is_guide');
  });
};
