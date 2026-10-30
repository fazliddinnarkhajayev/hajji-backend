import type { Knex } from 'knex';

/**
 * Groups are soft-deleted, so the ON DELETE CASCADE of their memberships never fired: pilgrims of
 * deleted groups kept their group / room / room-request rows, which are unique per pilgrim, and
 * could not join any other group. Deleting a group now frees them; this frees the ones left behind.
 */
exports.up = async function (knex: Knex) {
  const deleted = knex('groups').select('id').where({ is_deleted: true }).orWhereNotNull('deleted_at');
  await knex('room_members')
    .whereIn('room_id', knex('rooms').select('id').whereIn('group_id', deleted.clone()))
    .delete();
  await knex('room_request_members')
    .whereIn('room_request_id', knex('room_requests').select('id').whereIn('group_id', deleted.clone()))
    .delete();
  await knex('group_members').whereIn('group_id', deleted.clone()).delete();
};

// The removed rows pointed at deleted groups only; there is nothing to restore.
exports.down = async function () {};
