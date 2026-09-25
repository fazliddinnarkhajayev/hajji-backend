import type { Knex } from 'knex';

// One live confirmation per (procedure, pilgrim, role). Mobile clients replay
// offline confirmations, so duplicates must be impossible even under races.
exports.up = async function (knex: Knex) {
  // Soft-delete existing duplicates, keeping the earliest confirmation.
  await knex.raw(`
    UPDATE group_plan_confirmations c
    SET is_deleted = true
    FROM (
      SELECT id, ROW_NUMBER() OVER (
        PARTITION BY procedure_id, confirmed_by_user_id, confirmed_by_type
        ORDER BY confirmed_at ASC, created_at ASC, id ASC
      ) AS rn
      FROM group_plan_confirmations
      WHERE is_deleted = false
    ) d
    WHERE c.id = d.id AND d.rn > 1
  `);
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS group_plan_confirmations_unique
    ON group_plan_confirmations (procedure_id, confirmed_by_user_id, confirmed_by_type)
    WHERE is_deleted = false
  `);
};

exports.down = async function (knex: Knex) {
  await knex.raw(`DROP INDEX IF EXISTS group_plan_confirmations_unique`);
};
