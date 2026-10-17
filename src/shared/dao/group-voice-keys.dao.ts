import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { randomBytes } from 'crypto';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';

export interface GroupVoiceKey {
  group_id: string;
  /** base64, 32 bytes. Secret: only ever returned to members of the group via GET /mobile/profile. */
  key: string;
  key_version: number;
  created_at?: Date;
  rotated_at?: Date | null;
}

export const generateVoiceKey = (): string => randomBytes(32).toString('base64');

/**
 * Shared voice key per group ("Router orqali", hajji-guide docs/router-voice.md §4).
 * Created with the group, lazily provisioned if missing, never regenerated on read — only rotated
 * explicitly (key_version + 1). Separate table so `groups.*` queries cannot leak it.
 */
@Injectable()
export class GroupVoiceKeysDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private qb(trx?: Knex.Transaction) {
    return trx ? trx(TABLE_NAMES.GROUP_VOICE_KEYS) : this.db(TABLE_NAMES.GROUP_VOICE_KEYS);
  }

  /**
   * Returns the group's key, creating it first if the group (alive, not deleted) has none.
   * Race-safe: concurrent first reads insert at most once (ON CONFLICT DO NOTHING), then everyone
   * reads the same row.
   */
  async ensure(groupId: string, trx?: Knex.Transaction): Promise<GroupVoiceKey | undefined> {
    const existing = await this.qb(trx).where({ group_id: groupId }).first();
    if (existing) return existing as GroupVoiceKey;
    const db = trx ?? this.db;
    await db.raw(
      `INSERT INTO ${TABLE_NAMES.GROUP_VOICE_KEYS} (group_id, key, key_version)
       SELECT g.id, ?, 1 FROM ${TABLE_NAMES.GROUPS} g
       WHERE g.id = ? AND g.is_deleted = false AND g.deleted_at IS NULL
       ON CONFLICT (group_id) DO NOTHING`,
      [generateVoiceKey(), groupId],
    );
    return (await this.qb(trx).where({ group_id: groupId }).first()) as GroupVoiceKey | undefined;
  }

  /** New random key, key_version + 1 (e.g. after removing a member). Returns the public part only. */
  async rotate(groupId: string, trx?: Knex.Transaction): Promise<{ key_version: number; rotated_at: Date } | undefined> {
    await this.ensure(groupId, trx);
    const [row] = await this.qb(trx)
      .where({ group_id: groupId })
      .update({ key: generateVoiceKey(), key_version: (trx ?? this.db).raw('key_version + 1'), rotated_at: new Date() })
      .returning(['key_version', 'rotated_at']);
    return row as { key_version: number; rotated_at: Date } | undefined;
  }
}
