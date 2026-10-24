import type { Knex } from 'knex';

/**
 * Group lifecycle: FORMING → FORMED → IN_TRIP → TRIP_ENDED, plus CANCELLED.
 * Only CANCELLED is set by hand. The other stages are derived when a group is read
 * (members' visa/ticket + departure/return dates, see shared/dao/group-status.ts), so the stored
 * column only says "cancelled or not": every non-cancelled group is stored as FORMING.
 */
const NEW_VALUES = ['FORMING', 'FORMED', 'IN_TRIP', 'TRIP_ENDED', 'CANCELLED'];
const OLD_VALUES = ['NEW', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

const check = (values: string[]) => `CHECK (status IN (${values.map((v) => `'${v}'`).join(', ')}))`;

exports.up = async function (knex: Knex) {
  await knex.raw('ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_status_check');
  await knex('groups').whereNot({ status: 'CANCELLED' }).update({ status: 'FORMING' });
  await knex.raw(`ALTER TABLE groups ALTER COLUMN status SET DEFAULT 'FORMING'`);
  await knex.raw(`ALTER TABLE groups ADD CONSTRAINT groups_status_check ${check(NEW_VALUES)}`);
};

exports.down = async function (knex: Knex) {
  await knex.raw('ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_status_check');
  await knex('groups').whereNot({ status: 'CANCELLED' }).update({ status: 'NEW' });
  await knex.raw(`ALTER TABLE groups ALTER COLUMN status SET DEFAULT 'NEW'`);
  await knex.raw(`ALTER TABLE groups ADD CONSTRAINT groups_status_check ${check(OLD_VALUES)}`);
};
