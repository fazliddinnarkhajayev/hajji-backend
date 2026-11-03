import type { Knex } from 'knex';

/**
 * A group may exist without a guide (agency can unassign one from the groups
 * list). Guides may also lead several groups — there was never a uniqueness
 * constraint, only the index, so nothing to drop for that.
 */
exports.up = async function (knex: Knex) {
  await knex.raw('ALTER TABLE groups ALTER COLUMN guide_pilgrim_id DROP NOT NULL');
};

// Only reversible while every group still has a guide.
exports.down = async function (knex: Knex) {
  await knex.raw('ALTER TABLE groups ALTER COLUMN guide_pilgrim_id SET NOT NULL');
};
