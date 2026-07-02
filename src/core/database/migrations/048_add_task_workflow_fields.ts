import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.alterTable('tasks', (table) => {
    table.timestamp('started_at').nullable();
    table.timestamp('flagged_at').nullable();
    table.text('issue_comment').nullable();
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.alterTable('tasks', (table) => {
    table.dropColumn('started_at');
    table.dropColumn('flagged_at');
    table.dropColumn('issue_comment');
  });
};
