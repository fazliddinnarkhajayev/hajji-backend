import type { Knex } from 'knex';

/**
 * Language-specific text moved to `dua_translations`, so the legacy
 * single-language columns on `duas` become optional. Adds `sort_order`
 * for deterministic content ordering.
 */
exports.up = async function (knex: Knex) {
  await knex.schema.alterTable('duas', (table) => {
    table.string('title', 255).nullable().alter();
    table.integer('sort_order').nullable();
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.alterTable('duas', (table) => {
    table.dropColumn('sort_order');
    // Note: reverting title to NOT NULL may fail if null rows exist.
    table.string('title', 255).notNullable().alter();
  });
};
