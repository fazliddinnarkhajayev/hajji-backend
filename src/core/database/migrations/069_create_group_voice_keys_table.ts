import type { Knex } from 'knex';
import { randomBytes } from 'crypto';

// Shared voice key per group for "Router orqali" (hajji-guide docs/router-voice.md §4).
// Kept in its own table so no existing `groups.*` query (admin/agency lists) can ever return it.
exports.up = async function (knex: Knex) {
  const exists = await knex.schema.hasTable('group_voice_keys');
  if (!exists) {
    await knex.schema.createTable('group_voice_keys', (table) => {
      table.uuid('group_id').primary();
      table.text('key').notNullable(); // base64, 32 bytes from a CSPRNG
      table.integer('key_version').notNullable().defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('rotated_at').nullable();
      table.foreign('group_id').references('groups.id').onDelete('CASCADE');
    });
  }

  // Backfill existing groups (new ones get a key on creation, any gap is filled lazily on first read).
  const missing: Array<{ id: string }> = await knex('groups')
    .leftJoin('group_voice_keys', 'group_voice_keys.group_id', 'groups.id')
    .whereNull('group_voice_keys.group_id')
    .select('groups.id');
  for (const g of missing) {
    await knex('group_voice_keys')
      .insert({ group_id: g.id, key: randomBytes(32).toString('base64'), key_version: 1 })
      .onConflict('group_id')
      .ignore();
  }
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('group_voice_keys');
};
