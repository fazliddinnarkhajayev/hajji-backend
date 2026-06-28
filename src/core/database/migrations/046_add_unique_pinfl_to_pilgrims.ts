import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  const hasPinfl = await knex.schema.hasColumn('pilgrims', 'pinfl');
  if (hasPinfl) return;

  return knex.schema.alterTable('pilgrims', (table) => {
    table.string('pinfl', 14).nullable();
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.alterTable('pilgrims', (table) => {
    table.dropColumn('pinfl');
  });
};
