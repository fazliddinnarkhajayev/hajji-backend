import type { Knex } from 'knex';

/**
 * Passport data entered by the agency (typed or read from the passport's MRZ) and needed for the
 * visa / ticket exports. The scan itself is stored outside the public /uploads folder;
 * passport_photo_path is relative to <cwd>/private.
 */
exports.up = async function (knex: Knex) {
  const has = await knex.schema.hasColumn('pilgrims', 'passport_number');
  if (has) return;
  await knex.schema.alterTable('pilgrims', (table) => {
    table.date('birth_date').nullable();
    table.string('gender', 10).nullable(); // MALE | FEMALE
    table.string('citizenship', 3).nullable(); // ISO 3166-1 alpha-3, as in the MRZ (UZB)
    table.string('passport_number', 20).nullable();
    table.date('passport_issued_at').nullable();
    table.date('passport_expires_at').nullable();
    table.text('passport_photo_path').nullable();
    table.index('passport_number');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.alterTable('pilgrims', (table) => {
    table.dropIndex('passport_number');
    table.dropColumns(
      'birth_date', 'gender', 'citizenship', 'passport_number',
      'passport_issued_at', 'passport_expires_at', 'passport_photo_path',
    );
  });
};
