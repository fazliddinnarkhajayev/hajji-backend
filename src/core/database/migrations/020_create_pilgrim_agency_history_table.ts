import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.createTable('pilgrim_agency_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('pilgrim_id').notNullable();
    table.uuid('agency_id').nullable();
    table.uuid('admin_id').notNullable();
    table.enum('action', ['SET', 'REMOVE']).notNullable();
    table.text('notes').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Foreign keys
    table.foreign('pilgrim_id').references('pilgrims.id').onDelete('CASCADE');
    table.foreign('agency_id').references('agencies.id').onDelete('SET NULL');
    table.foreign('admin_id').references('admins.id').onDelete('CASCADE');

    // Indexes
    table.index('pilgrim_id');
    table.index('agency_id');
    table.index('admin_id');
    table.index('created_at');
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTableIfExists('pilgrim_agency_history');
};
