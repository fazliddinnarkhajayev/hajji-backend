import type { Knex } from 'knex';

/**
 * Agency billing with Hajji coins.
 *
 *   1 coin = 1 pilgrim × 1 trip. Registering a pilgrim is free; adding them to a group takes one
 *   coin from the agency's balance (no coins → the add fails). An activation stays with the pilgrim
 *   when they leave a group before any visa/ticket work, so the next group costs nothing.
 *
 *   billing_currencies    the price of one coin per currency, set by admins
 *   agencies              + currency_code (what the agency sees prices in) + coin_balance
 *   wallet_transactions   append-only ledger of every balance change
 *   pilgrim_activations   one row per paid (or legacy free) pilgrim trip
 *   refund_requests       agency asks for a coin back, an admin approves or rejects
 *
 * Pilgrims already in a group when this runs get a 0-coin IN_USE activation, so current trips
 * go on for free.
 */
exports.up = async function (knex: Knex) {
  await knex.schema.createTable('billing_currencies', (t) => {
    t.string('code', 3).primary();
    t.string('name', 60).notNullable();
    t.string('symbol', 10).notNullable();
    t.decimal('coin_price', 14, 2).notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.uuid('updated_by_id').nullable();
    t.foreign('updated_by_id').references('users.id').onDelete('SET NULL');
  });
  await knex.raw('ALTER TABLE billing_currencies ADD CONSTRAINT billing_currencies_price_check CHECK (coin_price > 0)');

  // Starting prices; admins change them on the "Coin narxlari" page.
  await knex('billing_currencies').insert([
    { code: 'UZS', name: "O'zbek so'mi", symbol: "so'm", coin_price: 12900 },
    { code: 'KZT', name: 'Qozoq tengesi', symbol: '₸', coin_price: 520 },
    { code: 'USD', name: 'AQSH dollari', symbol: '$', coin_price: 1 },
  ]);

  await knex.schema.alterTable('agencies', (t) => {
    t.string('currency_code', 3).notNullable().defaultTo('UZS');
    t.integer('coin_balance').notNullable().defaultTo(0);
    t.foreign('currency_code').references('billing_currencies.code');
  });
  await knex.raw('ALTER TABLE agencies ADD CONSTRAINT agencies_coin_balance_check CHECK (coin_balance >= 0)');

  await knex.schema.createTable('wallet_transactions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('agency_id').notNullable();
    t.string('type', 20).notNullable(); // TOPUP | ACTIVATION | REFUND | ADJUSTMENT
    t.integer('coins').notNullable(); // +topup / −activation
    t.integer('coins_after').notNullable();
    t.integer('pilgrim_count').nullable();
    t.uuid('group_id').nullable();
    t.string('currency_code', 3).nullable(); // TOPUP: what was paid
    t.decimal('coin_price', 14, 2).nullable();
    t.decimal('paid_amount', 16, 2).nullable();
    t.string('reference', 100).nullable(); // receipt / transfer number
    t.text('note').nullable();
    t.uuid('created_by_id').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());

    t.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    t.foreign('group_id').references('groups.id').onDelete('SET NULL');
    t.foreign('created_by_id').references('users.id').onDelete('SET NULL');
    t.index(['agency_id', 'created_at']);
  });
  await knex.raw(
    "ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_type_check CHECK (type IN ('TOPUP','ACTIVATION','REFUND','ADJUSTMENT'))",
  );

  await knex.schema.createTable('pilgrim_activations', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('agency_id').notNullable();
    t.uuid('pilgrim_id').notNullable();
    t.string('status', 20).notNullable(); // IN_USE | FREE | CONSUMED | REFUND_PENDING | REFUNDED
    t.integer('coins').notNullable(); // 1, or 0 for pilgrims grouped before billing started
    t.uuid('group_id').nullable(); // the group it was used for (last one when FREE/CONSUMED)
    t.uuid('transaction_id').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('updated_at').defaultTo(knex.fn.now());
    t.timestamp('consumed_at').nullable();

    t.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    t.foreign('pilgrim_id').references('pilgrims.id').onDelete('CASCADE');
    t.foreign('group_id').references('groups.id').onDelete('SET NULL');
    t.foreign('transaction_id').references('wallet_transactions.id').onDelete('SET NULL');
    t.index(['agency_id', 'created_at']);
  });
  await knex.raw(
    "ALTER TABLE pilgrim_activations ADD CONSTRAINT pilgrim_activations_status_check CHECK (status IN ('IN_USE','FREE','CONSUMED','REFUND_PENDING','REFUNDED'))",
  );
  // A pilgrim has at most one live activation per agency, so a double click can't charge twice.
  await knex.raw(
    "CREATE UNIQUE INDEX pilgrim_activations_live_unique ON pilgrim_activations (agency_id, pilgrim_id) WHERE status IN ('IN_USE','FREE','REFUND_PENDING')",
  );

  await knex.schema.createTable('refund_requests', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.increments('number', { primaryKey: false }); // #14 in the UI
    t.uuid('agency_id').notNullable();
    t.uuid('activation_id').notNullable();
    t.string('reason', 30).notNullable(); // WRONG_PILGRIM | TRIP_CANCELLED | DOUBLE_CHARGE | OTHER
    t.text('comment').nullable();
    t.string('status', 20).notNullable().defaultTo('PENDING'); // PENDING | APPROVED | REJECTED
    t.string('previous_status', 20).notNullable(); // activation status to restore on reject
    t.boolean('had_documents').notNullable().defaultTo(false); // visa/ticket work done when asked
    t.text('admin_comment').nullable();
    t.uuid('created_by_id').nullable();
    t.uuid('decided_by_id').nullable();
    t.uuid('transaction_id').nullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.timestamp('decided_at').nullable();

    t.foreign('agency_id').references('agencies.id').onDelete('CASCADE');
    t.foreign('activation_id').references('pilgrim_activations.id').onDelete('CASCADE');
    t.foreign('created_by_id').references('users.id').onDelete('SET NULL');
    t.foreign('decided_by_id').references('users.id').onDelete('SET NULL');
    t.foreign('transaction_id').references('wallet_transactions.id').onDelete('SET NULL');
    t.index(['status', 'created_at']);
    t.index(['agency_id', 'created_at']);
  });
  await knex.raw(
    "ALTER TABLE refund_requests ADD CONSTRAINT refund_requests_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED'))",
  );

  // Current group members keep going for free.
  await knex.raw(`
    INSERT INTO pilgrim_activations (agency_id, pilgrim_id, status, coins, group_id)
    SELECT g.agency_id, gm.pilgrim_id, 'IN_USE', 0, gm.group_id
    FROM group_members gm
    JOIN groups g ON g.id = gm.group_id
    ON CONFLICT DO NOTHING
  `);
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('refund_requests');
  await knex.schema.dropTableIfExists('pilgrim_activations');
  await knex.schema.dropTableIfExists('wallet_transactions');
  await knex.raw('ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_coin_balance_check');
  await knex.schema.alterTable('agencies', (t) => {
    t.dropForeign(['currency_code']);
    t.dropColumns('currency_code', 'coin_balance');
  });
  await knex.schema.dropTableIfExists('billing_currencies');
};
