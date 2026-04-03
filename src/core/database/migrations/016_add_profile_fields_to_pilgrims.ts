import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.alterTable('pilgrims', (table) => {
    table.string('first_name', 100).nullable();
    table.string('last_name', 100).nullable();
    table.string('middle_name', 100).nullable();
    table.text('avatar_url').nullable();
    table.string('region', 100).nullable();
    table.string('district', 100).nullable();
    table.string('language', 10).notNullable().defaultTo('uz');
    table.boolean('notifications_enabled').notNullable().defaultTo(true);
    table.boolean('elderly_mode').notNullable().defaultTo(false);
    table.string('theme', 20).notNullable().defaultTo('auto');
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.alterTable('pilgrims', (table) => {
    table.dropColumn('first_name');
    table.dropColumn('last_name');
    table.dropColumn('middle_name');
    table.dropColumn('avatar_url');
    table.dropColumn('region');
    table.dropColumn('district');
    table.dropColumn('language');
    table.dropColumn('notifications_enabled');
    table.dropColumn('elderly_mode');
    table.dropColumn('theme');
  });
};
