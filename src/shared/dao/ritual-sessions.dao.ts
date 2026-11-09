import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { PaginatedResult } from '../interfaces/pagination.interface';
import { BaseDao } from './base.dao';

export type RitualType = 'TAWAF' | 'SAI';
export type RitualSessionStatus = 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'INTERRUPTED';

export interface RitualSession {
  id: string;
  client_id: string;
  user_id: string;
  pilgrim_id: string | null;
  group_id: string | null;
  agency_id: string | null;
  type: RitualType;
  status: RitualSessionStatus;
  floor: string | null;
  target_count: number;
  completed_count: number;
  manual_count: number;
  adjust_plus: number;
  adjust_minus: number;
  pause_count: number;
  started_at: Date;
  completed_at: Date | null;
  duration_ms: number;
  paused_ms: number;
  distance_m: number | null;
  avg_accuracy_m: number | null;
  accepted_fixes: number;
  rejected_fixes: number;
  points_count: number;
  confidence_level: string | null;
  confidence: number | null;
  direction: string | null;
  is_test: boolean;
  centre: unknown;
  events: unknown;
  diagnostics: unknown;
  app_version: string | null;
  platform: string | null;
  device_info: string | null;
  device_updated_at: Date | null;
  synced_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface RitualSessionLapRow {
  number: number;
  started_at: Date | null;
  completed_at: Date;
  crossed_at: Date | null;
  duration_ms: number | null;
  distance_m: number | null;
  mean_radius_m: number | null;
  confidence: number | null;
  samples: number | null;
  manual: boolean;
  from_end: string | null;
  to_end: string | null;
}

export interface RitualSessionPointRow {
  seq: number;
  recorded_at: Date;
  lat: number;
  lng: number;
  accuracy: number | null;
  accepted: boolean;
}

export type RitualSessionUpsert = Omit<RitualSession, 'id' | 'synced_at' | 'created_at' | 'updated_at'>;

/** Points are inserted in chunks to stay under Postgres' bind-parameter limit. */
const POINT_CHUNK = 1000;

/** Columns of the admin list (no events / diagnostics / points). */
const LIST_COLUMNS = [
  's.id', 's.type', 's.status', 's.floor', 's.target_count', 's.completed_count', 's.manual_count',
  's.adjust_plus', 's.adjust_minus', 's.pause_count', 's.started_at', 's.completed_at', 's.duration_ms',
  's.paused_ms', 's.distance_m', 's.avg_accuracy_m', 's.points_count', 's.confidence_level', 's.is_test',
  's.platform', 's.app_version', 's.synced_at', 's.pilgrim_id', 's.group_id', 's.agency_id',
];

@Injectable()
export class RitualSessionsDao extends BaseDao<RitualSession> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.RITUAL_SESSIONS, db);
  }

  /** The caller's pilgrim record and current group / agency (any of them may be missing). */
  async findOwnerContext(
    userId: string,
    trx?: Knex.Transaction,
  ): Promise<{ pilgrim_id: string | null; group_id: string | null; agency_id: string | null }> {
    const db = trx ?? this.db;
    const row = await db(`${TABLE_NAMES.PILGRIMS} as p`)
      .leftJoin(`${TABLE_NAMES.GROUP_MEMBERS} as gm`, 'gm.pilgrim_id', 'p.id')
      .leftJoin(`${TABLE_NAMES.GROUPS} as g`, 'g.id', 'gm.group_id')
      .where({ 'p.user_id': userId, 'p.is_deleted': false })
      .select('p.id as pilgrim_id', 'gm.group_id', 'g.agency_id')
      .first();
    return { pilgrim_id: row?.pilgrim_id ?? null, group_id: row?.group_id ?? null, agency_id: row?.agency_id ?? null };
  }

  findByClientId(userId: string, clientId: string, trx?: Knex.Transaction): Promise<RitualSession | undefined> {
    return this.qb(trx).where({ user_id: userId, client_id: clientId }).first();
  }

  /**
   * Inserts the run or continues the stored one (same user + client id): the
   * summary, laps and events are replaced by the device's current ones, and
   * the points from `pointsFrom` on are (re)written — earlier points stay, so
   * each upload extends the path. A retried upload rewrites the same seqs, so
   * nothing is stored twice. Returns the id.
   */
  async upsert(
    row: RitualSessionUpsert,
    laps: RitualSessionLapRow[],
    points: RitualSessionPointRow[],
    pointsFrom: number,
    trx: Knex.Transaction,
  ): Promise<string> {
    const json = {
      ...row,
      centre: row.centre == null ? null : JSON.stringify(row.centre),
      events: JSON.stringify(row.events ?? []),
      diagnostics: row.diagnostics == null ? null : JSON.stringify(row.diagnostics),
    };
    const [{ id }] = await trx(TABLE_NAMES.RITUAL_SESSIONS)
      .insert(json)
      .onConflict(['user_id', 'client_id'])
      .merge({ ...json, synced_at: trx.fn.now(), updated_at: trx.fn.now() })
      .returning('id');

    await trx(TABLE_NAMES.RITUAL_SESSION_LAPS).where({ session_id: id }).delete();
    if (laps.length) {
      await trx(TABLE_NAMES.RITUAL_SESSION_LAPS).insert(laps.map((l) => ({ ...l, session_id: id })));
    }

    await trx(TABLE_NAMES.RITUAL_SESSION_POINTS).where({ session_id: id }).andWhere('seq', '>=', pointsFrom).delete();
    for (let i = 0; i < points.length; i += POINT_CHUNK) {
      await trx(TABLE_NAMES.RITUAL_SESSION_POINTS).insert(
        points.slice(i, i + POINT_CHUNK).map((p) => ({ ...p, session_id: id })),
      );
    }
    return id;
  }

  private listQuery() {
    return this.db(`${TABLE_NAMES.RITUAL_SESSIONS} as s`)
      .leftJoin(`${TABLE_NAMES.PILGRIMS} as p`, 'p.id', 's.pilgrim_id')
      .leftJoin(`${TABLE_NAMES.USERS} as u`, 'u.id', 's.user_id')
      .leftJoin(`${TABLE_NAMES.GROUPS} as g`, 'g.id', 's.group_id')
      .leftJoin(`${TABLE_NAMES.AGENCIES} as a`, 'a.id', 's.agency_id');
  }

  private personColumns() {
    return [
      'p.first_name',
      'p.last_name',
      'p.phone',
      'p.is_guide',
      'u.username',
      'g.name as group_name',
      'a.name as agency_name',
    ];
  }

  /** Newest first, with the pilgrim, group and agency names. */
  async listWithPilgrims(
    filters: { type?: RitualType },
    pageIndex: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResult<any>> {
    const where = (q: Knex.QueryBuilder) => {
      if (filters.type) q.where('s.type', filters.type);
      return q;
    };
    const [{ count }] = await where(this.db(`${TABLE_NAMES.RITUAL_SESSIONS} as s`)).count('* as count');
    const total = Number(count);

    const records = await where(this.listQuery())
      .select([...LIST_COLUMNS, ...this.personColumns()])
      .orderBy('s.started_at', 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);

    return new PaginatedResult(records, {
      total_items_count: total,
      total_pages_count: Math.ceil(total / pageSize),
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  findDetail(id: string) {
    return this.listQuery().select(['s.*', ...this.personColumns()]).where('s.id', id).first();
  }

  findLaps(sessionId: string): Promise<RitualSessionLapRow[]> {
    return this.db(TABLE_NAMES.RITUAL_SESSION_LAPS)
      .where({ session_id: sessionId })
      .select('number', 'started_at', 'completed_at', 'crossed_at', 'duration_ms', 'distance_m', 'mean_radius_m', 'confidence', 'samples', 'manual', 'from_end', 'to_end')
      .orderBy('number');
  }

  findPoints(sessionId: string): Promise<RitualSessionPointRow[]> {
    return this.db(TABLE_NAMES.RITUAL_SESSION_POINTS)
      .where({ session_id: sessionId })
      .select('seq', 'recorded_at', 'lat', 'lng', 'accuracy', 'accepted')
      .orderBy('seq');
  }
}
