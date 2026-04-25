import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  const hasTable = await knex.schema.hasTable('group_members');
  if (!hasTable) {
    return knex.schema.createTable('group_members', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('group_id').notNullable();
      table.uuid('pilgrim_id').notNullable();
      table.timestamp('joined_at').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Foreign keys
      table.foreign('group_id').references('groups.id').onDelete('CASCADE');
      table.foreign('pilgrim_id').references('pilgrims.id').onDelete('CASCADE');

      // Unique constraint: each pilgrim can only be in one group
      table.unique(['pilgrim_id']);

      // Indexes
      table.index('group_id');
      table.index('pilgrim_id');
    });
  }
};

exports.down = async function (knex: Knex) {
  return knex.schema.dropTableIfExists('group_members');
};
