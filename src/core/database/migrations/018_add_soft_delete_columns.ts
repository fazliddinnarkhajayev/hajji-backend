import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  // Add is_deleted and deleted_at to users table (missing is_deleted)
  const usersHasIsDeleted = await knex.schema.hasColumn('users', 'is_deleted');
  const usersHasDeletedAt = await knex.schema.hasColumn('users', 'deleted_at');
  if (!usersHasIsDeleted || !usersHasDeletedAt) {
    await knex.schema.table('users', (table) => {
      if (!usersHasIsDeleted) {
        table.boolean('is_deleted').defaultTo(false);
      }
      if (!usersHasDeletedAt) {
        table.timestamp('deleted_at').nullable();
      }
    });
  }

  // Add deleted_at to regions table
  const regionsHasDeletedAt = await knex.schema.hasColumn('regions', 'deleted_at');
  if (!regionsHasDeletedAt) {
    await knex.schema.table('regions', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to districts table
  const districtsHasDeletedAt = await knex.schema.hasColumn('districts', 'deleted_at');
  if (!districtsHasDeletedAt) {
    await knex.schema.table('districts', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to admins table
  const adminsHasDeletedAt = await knex.schema.hasColumn('admins', 'deleted_at');
  if (!adminsHasDeletedAt) {
    await knex.schema.table('admins', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to refresh_tokens table
  const refreshTokensHasDeletedAt = await knex.schema.hasColumn('refresh_tokens', 'deleted_at');
  if (!refreshTokensHasDeletedAt) {
    await knex.schema.table('refresh_tokens', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to agencies table
  const agenciesHasDeletedAt = await knex.schema.hasColumn('agencies', 'deleted_at');
  if (!agenciesHasDeletedAt) {
    await knex.schema.table('agencies', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to agency_users table
  const agencyUsersHasDeletedAt = await knex.schema.hasColumn('agency_users', 'deleted_at');
  if (!agencyUsersHasDeletedAt) {
    await knex.schema.table('agency_users', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to pilgrims table
  const pilgrimsHasDeletedAt = await knex.schema.hasColumn('pilgrims', 'deleted_at');
  if (!pilgrimsHasDeletedAt) {
    await knex.schema.table('pilgrims', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to countries table
  const countriesHasDeletedAt = await knex.schema.hasColumn('countries', 'deleted_at');
  if (!countriesHasDeletedAt) {
    await knex.schema.table('countries', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to otp_sessions table
  const otpSessionsHasDeletedAt = await knex.schema.hasColumn('otp_sessions', 'deleted_at');
  if (!otpSessionsHasDeletedAt) {
    await knex.schema.table('otp_sessions', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }

  // Add deleted_at to locations table
  const locationsHasDeletedAt = await knex.schema.hasColumn('locations', 'deleted_at');
  if (!locationsHasDeletedAt) {
    await knex.schema.table('locations', (table) => {
      table.timestamp('deleted_at').nullable();
    });
  }
};

exports.down = async function (knex: Knex) {
  // Remove deleted_at and is_deleted from users table
  await knex.schema.table('users', async (table) => {
    if (await knex.schema.hasColumn('users', 'deleted_at')) {
      table.dropColumn('deleted_at');
    }
    if (await knex.schema.hasColumn('users', 'is_deleted')) {
      table.dropColumn('is_deleted');
    }
  });

  // Remove deleted_at from all other tables
  const tables = [
    'regions',
    'districts',
    'admins',
    'refresh_tokens',
    'agencies',
    'agency_users',
    'pilgrims',
    'countries',
    'otp_sessions',
    'locations',
  ];

  for (const tableName of tables) {
    await knex.schema.table(tableName, async (table) => {
      if (await knex.schema.hasColumn(tableName, 'deleted_at')) {
        table.dropColumn('deleted_at');
      }
    });
  }
};
