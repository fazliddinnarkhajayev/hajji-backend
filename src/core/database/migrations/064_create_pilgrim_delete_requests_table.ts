import type { Knex } from 'knex';

/**
 * Account-deletion requests raised by a pilgrim from the mobile app. The pilgrim
 * submits a PENDING request; an admin later approves it (which soft-deletes the
 * pilgrim). The pilgrim may CANCEL a still-pending request. At most one active
 * (PENDING, non-deleted) request may exist per pilgrim.
 */
exports.up = async function (knex: Knex) {
  const has = await knex.schema.hasTable('pilgrim_delete_requests');
  if (has) return;
  await knex.schema.createTable('pilgrim_delete_requests', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pilgrim_id').notNullable();
    table.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING | APPROVED | CANCELLED
    table.uuid('reviewed_by_id').nullable();
    table.timestamp('reviewed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('updated_by_id').nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at').nullable();

    table.foreign('pilgrim_id').references('pilgrims.id').onDelete('CASCADE');
    table.index(['pilgrim_id', 'status']);
  });

  // At most one active (pending, non-deleted) request per pilgrim.
  await knex.raw(`
    CREATE UNIQUE INDEX pilgrim_delete_requests_active_unique
    ON pilgrim_delete_requests (pilgrim_id)
    WHERE status = 'PENDING' AND is_deleted = false
  `);
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTableIfExists('pilgrim_delete_requests');
};
