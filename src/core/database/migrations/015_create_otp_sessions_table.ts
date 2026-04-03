import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.createTable('otp_sessions', (table) => {
    table.uuid('id').primary().notNullable();
    table.string('phone', 20).notNullable(); // Normalized phone (last 10 digits)
    table.string('code', 10).notNullable(); // OTP code (4-10 digits)
    table.enum('method', ['SMS', 'TELEGRAM']).notNullable().defaultTo('SMS');
    table.integer('attempts').notNullable().defaultTo(0); // Number of failed verification attempts
    table.boolean('is_used').notNullable().defaultTo(false); // Whether OTP has been used
    table.enum('status', ['PENDING', 'VERIFIED', 'EXPIRED', 'USED']).notNullable().defaultTo('PENDING');
    table.boolean('is_deleted').notNullable().defaultTo(false);
    table.timestamp('expires_at').notNullable(); // OTP expiration timestamp
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());

    // Indexes for querying
    table.index(['phone', 'expires_at']); // For finding latest OTP by phone
    table.index(['phone', 'is_deleted', 'status']); // For status queries
    table.index('created_at'); // For ordering by creation time
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('otp_sessions');
};
