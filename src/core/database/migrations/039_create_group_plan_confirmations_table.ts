import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('group_plan_confirmations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('procedure_id').notNullable();
    table.uuid('confirmed_by_user_id').notNullable();
    table.string('confirmed_by_type').notNullable(); // 'PILGRIM' | 'GUIDE'
    table.text('comment').nullable();
    table.timestamp('confirmed_at').defaultTo(knex.fn.now());
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('procedure_id').references('group_plan_procedures.id').onDelete('CASCADE');
    table.index('procedure_id');
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('group_plan_confirmations');
};
