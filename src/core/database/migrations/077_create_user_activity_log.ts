import type { Knex } from 'knex';

/**
 * Sign-ups and logins of pilgrims, guides and admins, shown on the admin Activities page.
 * users.last_login_at keeps only the latest login, so history needs its own table.
 */
exports.up = async function (knex: Knex) {
  await knex.schema.createTable('user_activity_log', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable();
    table.string('action', 20).notNullable(); // REGISTER | LOGIN
    table.string('method', 20).nullable(); // SMS | TELEGRAM | GOOGLE | PASSWORD
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.index('created_at');
    table.index(['user_id', 'created_at']);
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('user_activity_log');
};
