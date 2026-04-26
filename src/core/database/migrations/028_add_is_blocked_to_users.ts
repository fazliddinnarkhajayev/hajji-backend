import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  const hasIsBlocked = await knex.schema.hasColumn('users', 'is_blocked');

  if (!hasIsBlocked) {
    await knex.schema.alterTable('users', (table) => {
      table.boolean('is_blocked').notNullable().defaultTo(false);
    });
  }
};

exports.down = async function (knex: Knex) {
  const hasIsBlocked = await knex.schema.hasColumn('users', 'is_blocked');

  if (hasIsBlocked) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('is_blocked');
    });
  }
};
