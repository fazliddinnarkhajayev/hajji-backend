import type { Knex } from 'knex';

/**
 * Tawaf and Sa'y runs tracked by the Hajji Guide app (GPS lap / trip counting).
 * The app records each run on the device (offline) and uploads it while it
 * goes on (every few minutes, when online) and when it ends; each upload
 * continues the same row and appends the new GPS points. The admin panel
 * lists the runs and draws the walked path.
 *
 *   ritual_sessions        one row per run (summary, events, diagnostics)
 *   ritual_session_laps    Tawaf laps / Sa'y trips of a run
 *   ritual_session_points  GPS fixes received while tracking (the walked path)
 *
 * (user_id, client_id) is unique: the device generates client_id, so every
 * upload of a run lands on the same row and retries are idempotent.
 */
exports.up = async function (knex: Knex) {
  await knex.schema.createTable('ritual_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('client_id').notNullable();
    table.uuid('user_id').notNullable();
    table.uuid('pilgrim_id').nullable();
    // Group / agency the pilgrim belonged to when the run was uploaded.
    table.uuid('group_id').nullable();
    table.uuid('agency_id').nullable();

    table.string('type', 10).notNullable(); // TAWAF | SAI
    table.string('status', 20).notNullable(); // IN_PROGRESS | PAUSED | COMPLETED | INTERRUPTED
    table.string('floor', 20).nullable(); // mataf | floor2 | floor3 | roof · ground | floor1 | floor2 | roof

    table.integer('target_count').notNullable().defaultTo(7);
    table.integer('completed_count').notNullable().defaultTo(0);
    table.integer('manual_count').notNullable().defaultTo(0); // laps / trips confirmed by hand
    table.integer('adjust_plus').notNullable().defaultTo(0); // "+1" corrections
    table.integer('adjust_minus').notNullable().defaultTo(0); // "−1" corrections
    table.integer('pause_count').notNullable().defaultTo(0);

    table.timestamp('started_at', { useTz: true }).notNullable();
    table.timestamp('completed_at', { useTz: true }).nullable();
    table.integer('duration_ms').notNullable().defaultTo(0); // started → completed
    table.integer('paused_ms').notNullable().defaultTo(0);

    table.double('distance_m').nullable(); // along the accepted fixes
    table.double('avg_accuracy_m').nullable();
    table.integer('accepted_fixes').notNullable().defaultTo(0);
    table.integer('rejected_fixes').notNullable().defaultTo(0);
    table.integer('points_count').notNullable().defaultTo(0);
    table.string('confidence_level', 10).nullable(); // HIGH | MEDIUM | LOW (at the end)
    table.double('confidence').nullable(); // 0…1 (Tawaf)
    table.string('direction', 20).nullable(); // Tawaf: COUNTER_CLOCKWISE…

    table.boolean('is_test').notNullable().defaultTo(false); // developer test centre / line
    table.jsonb('centre').nullable(); // Tawaf: {lat,lng} · Sa'y: {safa:{lat,lng}, marwa:{lat,lng}}
    table.jsonb('events').notNullable().defaultTo('[]'); // [{type, at, value?}]
    table.jsonb('diagnostics').nullable(); // tracker counters, rejections, anomalies

    table.string('app_version', 50).nullable();
    table.string('platform', 20).nullable();
    table.text('device_info').nullable();

    table.timestamp('device_updated_at', { useTz: true }).nullable();
    table.timestamp('synced_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.foreign('user_id').references('users.id').onDelete('CASCADE');
    table.foreign('pilgrim_id').references('pilgrims.id').onDelete('SET NULL');
    table.foreign('group_id').references('groups.id').onDelete('SET NULL');
    table.foreign('agency_id').references('agencies.id').onDelete('SET NULL');
    table.unique(['user_id', 'client_id']);
    table.index('started_at');
    table.index(['pilgrim_id', 'started_at']);
    table.index('group_id');
  });

  await knex.schema.createTable('ritual_session_laps', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('session_id').notNullable();
    table.integer('number').notNullable(); // 1-based
    table.timestamp('started_at', { useTz: true }).nullable();
    table.timestamp('completed_at', { useTz: true }).notNullable();
    table.timestamp('crossed_at', { useTz: true }).nullable(); // Tawaf: lap line crossing
    table.integer('duration_ms').nullable();
    table.double('distance_m').nullable();
    table.double('mean_radius_m').nullable(); // Tawaf
    table.double('confidence').nullable(); // Tawaf, 0…1
    table.integer('samples').nullable(); // Tawaf: fixes integrated into the lap
    table.boolean('manual').notNullable().defaultTo(false);
    table.string('from_end', 10).nullable(); // Sa'y: SAFA | MARWA
    table.string('to_end', 10).nullable();

    table.foreign('session_id').references('ritual_sessions.id').onDelete('CASCADE');
    table.unique(['session_id', 'number']);
  });

  await knex.schema.createTable('ritual_session_points', (table) => {
    table.bigIncrements('id').primary();
    table.uuid('session_id').notNullable();
    table.integer('seq').notNullable();
    table.timestamp('recorded_at', { useTz: true }).notNullable();
    table.double('lat').notNullable();
    table.double('lng').notNullable();
    table.float('accuracy').nullable();
    table.boolean('accepted').notNullable().defaultTo(true); // used by the tracker

    table.foreign('session_id').references('ritual_sessions.id').onDelete('CASCADE');
    table.index(['session_id', 'seq']);
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('ritual_session_points');
  await knex.schema.dropTableIfExists('ritual_session_laps');
  await knex.schema.dropTableIfExists('ritual_sessions');
};
