import type { Knex } from 'knex';

/**
 * One-off import of pilgrims from a passport list. It has already been applied; the data was
 * removed from this file so personal details stay out of the repository. The file must keep this
 * name, because knex fails when a migration recorded in the database is missing.
 */
exports.up = async function (_knex: Knex) {};

exports.down = async function (_knex: Knex) {};
