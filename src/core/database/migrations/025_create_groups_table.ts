import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  return knex.schema.createTable('groups', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('agency_id').notNullable();
    table.string('name').notNullable();
    table.text('description').nullable();
    table.timestamp('departure_date').notNullable();
    table.timestamp('return_date').notNullable();
    table.string('meeting_point').nullable();
    table.uuid('guide_pilgrim_id').notNullable();
    table.enum('status', ['NEW', 'ACTIVE', 'COMPLETED', 'CANCELLED']).notNullable().defaultTo('NEW');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by_id').nullable();
    table.uuid('updated_by_id').nullable();
    table.boolean('is_deleted').defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by_id').nullable();

    // Foreign keys
    table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    table.foreign('guide_pilgrim_id').references('pilgrims.id').onDelete('CASCADE');
    table.foreign('created_by_id').references('users.id').onDelete('SET NULL');
    table.foreign('updated_by_id').references('users.id').onDelete('SET NULL');
    table.foreign('deleted_by_id').references('users.id').onDelete('SET NULL');

    // Indexes
    table.index('agency_id');
    table.index('guide_pilgrim_id');
    table.index('status');
    table.index('is_deleted');
  });
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTable('groups');
};
