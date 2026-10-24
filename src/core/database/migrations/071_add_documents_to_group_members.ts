import type { Knex } from 'knex';

/**
 * Per-member visa and air-ticket tracking. Kept on the membership because both belong to one trip.
 * A member is "ready" when visa_status = ISSUED and ticket_status = ISSUED.
 *   visa_status:   NONE | SUBMITTED | ISSUED | REJECTED
 *   ticket_status: NONE | BOOKED | ISSUED
 */
exports.up = async function (knex: Knex) {
  const has = await knex.schema.hasColumn('group_members', 'visa_status');
  if (has) return;
  await knex.schema.alterTable('group_members', (table) => {
    table.string('visa_status', 20).notNullable().defaultTo('NONE');
    table.string('visa_number', 50).nullable();
    table.date('visa_issued_at').nullable();
    table.date('visa_expires_at').nullable();
    table.string('ticket_status', 20).notNullable().defaultTo('NONE');
    table.string('ticket_number', 50).nullable();
    table.string('flight_number', 30).nullable();
    table.timestamp('flight_date').nullable();
    table.string('pnr', 20).nullable();
    table.text('documents_note').nullable();
    table.timestamp('documents_updated_at').nullable();
    table.uuid('documents_updated_by_id').nullable();
    table.foreign('documents_updated_by_id').references('users.id').onDelete('SET NULL');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.alterTable('group_members', (table) => {
    table.dropForeign(['documents_updated_by_id']);
    table.dropColumns(
      'visa_status', 'visa_number', 'visa_issued_at', 'visa_expires_at',
      'ticket_status', 'ticket_number', 'flight_number', 'flight_date', 'pnr',
      'documents_note', 'documents_updated_at', 'documents_updated_by_id',
    );
  });
};
