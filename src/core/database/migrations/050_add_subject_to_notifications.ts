import type { Knex } from 'knex';

exports.up = async function (knex: Knex) {
  await knex.schema.alterTable('notifications', (table) => {
    // The entity name/title (task title, group name, pilgrim name, etc.) kept
    // separate from the pre-formatted English `message` — lets clients build a
    // fully localized sentence via a per-language template instead of showing
    // message's baked-in English phrasing untranslated.
    table.string('subject').nullable();
  });
};

exports.down = async function (knex: Knex) {
  await knex.schema.alterTable('notifications', (table) => {
    table.dropColumn('subject');
  });
};
