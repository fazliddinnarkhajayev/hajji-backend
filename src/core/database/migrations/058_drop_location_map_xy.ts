import type { Knex } from 'knex';

/**
 * Removes the illustrative mini-map position columns (map_x / map_y).
 * The app will use real geo `coords` for the upcoming real map, so these are
 * no longer needed. Guarded so it is a no-op on fresh databases where 056 no
 * longer creates them.
 */
exports.up = async function (knex: Knex) {
  const hasMapX = await knex.schema.hasColumn('locations', 'map_x');
  const hasMapY = await knex.schema.hasColumn('locations', 'map_y');
  if (hasMapX || hasMapY) {
    await knex.schema.alterTable('locations', (table) => {
      if (hasMapX) table.dropColumn('map_x');
      if (hasMapY) table.dropColumn('map_y');
    });
  }
};

exports.down = async function (knex: Knex) {
  const hasMapX = await knex.schema.hasColumn('locations', 'map_x');
  const hasMapY = await knex.schema.hasColumn('locations', 'map_y');
  await knex.schema.alterTable('locations', (table) => {
    if (!hasMapX) table.string('map_x', 16).nullable();
    if (!hasMapY) table.string('map_y', 16).nullable();
  });
};
