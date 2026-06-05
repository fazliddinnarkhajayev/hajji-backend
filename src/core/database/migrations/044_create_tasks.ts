import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('agency_id').notNullable();
    table.uuid('created_by_id').notNullable();
    table.uuid('assigned_to_id').notNullable();
    table.uuid('category_id').nullable();
    table.string('title').notNullable();
    table.text('comment').nullable();
    table.timestamp('scheduled_time').nullable();

    // Optional location to verify at completion
    table.string('location_name').nullable();
    table.decimal('location_lat', 10, 7).nullable();
    table.decimal('location_lng', 10, 7).nullable();
    table.integer('location_radius_meters').nullable().defaultTo(100);

    // Status
    table.string('status').notNullable().defaultTo('PENDING');

    // Completion data
    table.timestamp('completed_at').nullable();
    table.decimal('completed_lat', 10, 7).nullable();
    table.decimal('completed_lng', 10, 7).nullable();
    table.text('completed_comment').nullable();

    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.uuid('deleted_by_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    table.foreign('created_by_id').references('agency_users.id');
    table.foreign('assigned_to_id').references('agency_users.id');
    table.foreign('category_id').references('task_categories.id').onDelete('SET NULL');
    table.index('agency_id');
    table.index('assigned_to_id');
    table.index('created_by_id');
    table.index('status');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('tasks');
};
