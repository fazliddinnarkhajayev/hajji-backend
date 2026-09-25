import type { Knex } from 'knex';

/**
 * Adds multilingual support + content fields to locations, mirroring duas.
 *
 * - New `location_translations` table (per-language name/description).
 * - Existing single-language name/description backfilled into an `en` row.
 * - New content fields on `locations`: category, sort_order.
 *   (Real geo position lives in `coords`.)
 *
 * Base `name`/`name_ar`/`coords`/`emoji`/`description` stay populated so the
 * existing admin UI and hajji-mobile keep working.
 */
exports.up = async function (knex: Knex) {
  const hasTable = await knex.schema.hasTable('location_translations');
  if (!hasTable) {
    await knex.schema.createTable('location_translations', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('location_id').notNullable();
      table.string('lang', 16).notNullable(); // en | ru | uz_latin | uz_cyr
      table.string('name', 255).nullable();
      table.text('description').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.foreign('location_id').references('locations.id').onDelete('CASCADE');
      table.unique(['location_id', 'lang']);
      table.index('location_id');
    });
  }

  const hasCategory = await knex.schema.hasColumn('locations', 'category');
  if (!hasCategory) {
    await knex.schema.alterTable('locations', (table) => {
      table.string('category', 100).nullable();
      table.integer('sort_order').nullable();
    });
  }

  // Backfill existing locations into an `en` translation row.
  const locations = await knex('locations').select('id', 'name', 'description');
  for (const l of locations) {
    const exists = await knex('location_translations')
      .where({ location_id: l.id, lang: 'en' })
      .first();
    if (!exists) {
      await knex('location_translations').insert({
        location_id: l.id,
        lang: 'en',
        name: l.name ?? null,
        description: l.description ?? null,
      });
    }
  }
};

exports.down = async function (knex: Knex) {
  await knex.schema.dropTableIfExists('location_translations');
  await knex.schema.alterTable('locations', (table) => {
    table.dropColumn('category');
    table.dropColumn('sort_order');
  });
};
