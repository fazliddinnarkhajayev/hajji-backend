import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.createTable('invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pilgrim_id').notNullable();
    table.uuid('agency_id').notNullable();
    table.uuid('invited_by').notNullable();
    table.enum('status', ['PENDING', 'ACCEPTED', 'REJECTED']).notNullable().defaultTo('PENDING');
    table.text('message').nullable();
    table.timestamp('expires_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('pilgrim_id').references('pilgrims.id').onDelete('CASCADE');
    table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    table.foreign('invited_by').references('users.id').onDelete('CASCADE');

    // Unique constraint: one active invitation per pilgrim per agency
    table.unique(['pilgrim_id', 'agency_id'], { indexName: 'unique_pending_invitation' });
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTable('invitations');
};
