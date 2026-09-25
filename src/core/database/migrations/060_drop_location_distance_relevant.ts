import type { Knex } from 'knex';

/**
 * Removes `distance` and `relevant` from locations. Both are contextual, not
 * static content: distance depends on the user's live GPS position (compute
 * from `coords`), and relevance depends on the pilgrim's current ritual step
 * (derive from a ritual-step relation later). Guarded for fresh databases.
 */
exports.up = async function (knex: Knex) {
  const hasDistance = await knex.schema.hasColumn('locations', 'distance');
  const hasRelevant = await knex.schema.hasColumn('locations', 'relevant');
  if (hasDistance || hasRelevant) {
    await knex.schema.alterTable('locations', (table) => {
      if (hasDistance) table.dropColumn('distance');
      if (hasRelevant) table.dropColumn('relevant');
    });
  }
};

exports.down = async function (knex: Knex) {
  const hasDistance = await knex.schema.hasColumn('locations', 'distance');
  const hasRelevant = await knex.schema.hasColumn('locations', 'relevant');
  await knex.schema.alterTable('locations', (table) => {
    if (!hasDistance) table.string('distance', 32).nullable();
    if (!hasRelevant) table.boolean('relevant').defaultTo(false);
  });
};
