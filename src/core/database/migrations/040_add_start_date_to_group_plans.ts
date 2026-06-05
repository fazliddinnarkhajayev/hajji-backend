import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.alterTable('group_plans', (table) => {
    table.date('start_date').nullable();
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.alterTable('group_plans', (table) => {
    table.dropColumn('start_date');
  });
};
