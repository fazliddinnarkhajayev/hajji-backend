# Group voice keys ("Router orqali")

Mobile app spec: `hajji-guide/docs/router-voice.md` (§4). Temporary model: ONE shared key per group.

## Data
`group_voice_keys` (migration `069_create_group_voice_keys_table.ts`):
`group_id` (PK, FK `groups.id` ON DELETE CASCADE) · `key` (base64 of 32 bytes from `crypto.randomBytes`) ·
`key_version` (int, starts at 1) · `created_at` · `rotated_at`.

A separate table on purpose: admin/agency endpoints return `groups.*`; a column there would leak the key.

## Lifecycle
* **Create:** admin `POST /admins/groups` and agency `POST /agencies/groups` insert the group and its key in one
  transaction.
* **Existing groups:** the migration backfills a key for every group.
* **Lazy provisioning:** `GroupVoiceKeysDao.ensure()` creates a missing key on first read
  (`INSERT … SELECT … ON CONFLICT DO NOTHING` — race-safe, never for deleted groups). It never regenerates.
* **Rotate:** `POST /agencies/groups/:groupId/voice-key/rotate` (agency owning the group) → new key,
  `key_version + 1`; responds with `{ key_version, rotated_at }` only.

## API
`GET /mobile/profile` (pilgrim JWT) → `data.group.voice = { member_id, key, key_version }` when the caller is in
`group_members` of a non-cancelled group. `member_id` = `pilgrims.id` (same as `pilgrim_id` in
`GET /mobile/plans/members`). Response has `Cache-Control: no-store`. Other profile endpoints do not include it.
Guides get it like any member (they are in `group_members`, as the plans endpoints already require).

## Security notes
* The key is stored in plaintext in the DB (as other app secrets are); encrypting it at rest with a server
  secret is a possible follow-up.
* Shared key + self-declared member id does not prove *which* member a phone is; it proves "has this group's key".
* A removed member keeps the old key until rotation, and phones only receive a rotated key when they are online.
  Offline revocation is not immediate.
* Never log responses of `GET /mobile/profile`.

## Deploy
`npm run db:migrate` (development) / the production knexfile equivalent, then restart. No new env variables.

## Verified
`tsc --noEmit` and `nest build` pass. The migration and DAO SQL (as knex generates it) were run on PGlite
(Postgres in WASM): backfill, no regeneration, concurrent first reads → one row, no key for deleted groups,
rotation, cascade on group delete. Not yet run against the real database.
