import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('group_plan_procedures', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('plan_id').notNullable();
    table.integer('day_index').notNullable();           // 1-based day number
    table.string('title').notNullable();
    table.string('meeting_time').notNullable();         // "09:00" format
    table.integer('duration_minutes').notNullable();
    table.string('location').nullable();
    table.boolean('requires_confirmation').notNullable().defaultTo(false);
    table.string('confirmation_by').nullable();         // 'PILGRIM' | 'GUIDE' | 'BOTH'
    table.integer('order_index').notNullable().defaultTo(0);
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('plan_id').references('group_plans.id').onDelete('CASCADE');
    table.index('plan_id');
    table.index(['plan_id', 'day_index']);
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('group_plan_procedures');
};
