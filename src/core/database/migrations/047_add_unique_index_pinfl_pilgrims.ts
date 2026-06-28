import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.raw(`
    CREATE UNIQUE INDEX IF NOT EXISTS pilgrims_pinfl_unique
    ON pilgrims (pinfl)
    WHERE pinfl IS NOT NULL
  `);
};

exports.down = async function (knex: Knex) {
  await knex.raw(`DROP INDEX IF EXISTS pilgrims_pinfl_unique`);
};
