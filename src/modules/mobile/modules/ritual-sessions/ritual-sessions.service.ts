import { Injectable, Logger } from '@nestjs/common';
import {
  RitualSessionLapRow,
  RitualSessionPointRow,
  RitualSessionsDao,
} from 'src/shared/dao/ritual-sessions.dao';
import { RitualSessionDto } from './dto/sync-ritual-sessions.dto';

export interface SyncResult {
  /** client_ids stored (new or continued) — the app marks them synced. */
  synced: string[];
  /**
   * Points the server holds per run (synced or not): the app sends the next
   * upload from there. Lower than what was sent when an earlier upload is
   * missing (a gap) — the app then resends from this index.
   */
  points_count: Record<string, number>;
  /** client_ids the server could not store, with the reason. Not retried by the app. */
  rejected: { client_id: string; message: string }[];
}

/** Runs may be uploaded late, but never from the future. */
const CLOCK_SKEW_MS = 10 * 60 * 1000;

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const int = (v: unknown): number | null => {
  const n = num(v);
  return n === null ? null : Math.round(n);
};
const date = (v: unknown): Date | null => {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};
const str = (v: unknown, max: number): string | null => (typeof v === 'string' && v ? v.slice(0, max) : null);
const END = new Set(['SAFA', 'MARWA']);

@Injectable()
export class MobileRitualSessionsService {
  private readonly logger = new Logger(MobileRitualSessionsService.name);

  constructor(private readonly dao: RitualSessionsDao) {}

  async sync(userId: string, sessions: RitualSessionDto[]): Promise<SyncResult> {
    const result: SyncResult = { synced: [], points_count: {}, rejected: [] };
    if (!sessions.length) return result;
    const owner = await this.dao.findOwnerContext(userId);

    for (const s of sessions) {
      try {
        const startedAt = new Date(s.started_at);
        if (startedAt.getTime() > Date.now() + CLOCK_SKEW_MS) {
          result.rejected.push({ client_id: s.client_id, message: 'started_at is in the future' });
          continue;
        }
        const updatedAt = s.updated_at ? new Date(s.updated_at) : null;
        const laps = this.laps(s.laps);
        let pointsFrom = s.points_from ?? 0;
        let points = this.points(s.points, pointsFrom);

        const stored = await this.dao.findByClientId(userId, s.client_id);
        const storedPoints = stored?.points_count ?? 0;
        // An older upload arriving late (retried request): the server already has newer data.
        if (stored?.device_updated_at && updatedAt && updatedAt < new Date(stored.device_updated_at)) {
          result.synced.push(s.client_id);
          result.points_count[s.client_id] = storedPoints;
          continue;
        }
        // Points before this upload are missing (an earlier upload was lost): keep the
        // summary, skip the points and tell the app where to resend from.
        const gap = pointsFrom > storedPoints;
        if (gap) {
          pointsFrom = storedPoints;
          points = [];
        }
        // Counted from the raw array: a malformed fix that was dropped still takes its seq.
        const pointsCount = gap ? storedPoints : pointsFrom + (s.points?.length ?? 0);

        await this.dao.transaction((trx) =>
          this.dao.upsert(
            {
              client_id: s.client_id,
              user_id: userId,
              pilgrim_id: owner.pilgrim_id,
              group_id: owner.group_id,
              agency_id: owner.agency_id,
              type: s.type,
              status: s.status,
              floor: s.floor ?? null,
              target_count: s.target_count,
              completed_count: s.completed_count,
              manual_count: s.manual_count ?? laps.filter((l) => l.manual).length,
              adjust_plus: s.adjust_plus ?? 0,
              adjust_minus: s.adjust_minus ?? 0,
              pause_count: s.pause_count ?? 0,
              started_at: startedAt,
              completed_at: s.completed_at ? new Date(s.completed_at) : null,
              duration_ms: s.duration_ms,
              paused_ms: s.paused_ms ?? 0,
              distance_m: s.distance_m ?? null,
              avg_accuracy_m: s.avg_accuracy_m ?? null,
              accepted_fixes: s.accepted_fixes ?? 0,
              rejected_fixes: s.rejected_fixes ?? 0,
              points_count: pointsCount,
              confidence_level: s.confidence_level ?? null,
              confidence: s.confidence ?? null,
              direction: s.direction ?? null,
              is_test: !!s.is_test,
              centre: s.centre ?? null,
              events: this.events(s.events),
              diagnostics: s.diagnostics ?? null,
              app_version: s.app_version ?? null,
              platform: s.platform ?? null,
              device_info: s.device_info ?? null,
              device_updated_at: updatedAt,
            },
            laps,
            points,
            pointsFrom,
            trx,
          ),
        );
        // Synced only when no points are missing; otherwise the app resends from points_count.
        if (!gap) result.synced.push(s.client_id);
        result.points_count[s.client_id] = pointsCount;
      } catch (error) {
        this.logger.warn(`Ritual session ${s.client_id} of user ${userId} not stored: ${error.message}`);
        result.rejected.push({ client_id: s.client_id, message: 'could not be stored' });
      }
    }
    return result;
  }

  private laps(raw: Record<string, unknown>[]): RitualSessionLapRow[] {
    const seen = new Set<number>();
    const laps: RitualSessionLapRow[] = [];
    for (const l of raw ?? []) {
      if (!l || typeof l !== 'object') continue;
      const number = int(l.number);
      const completedAt = date(l.completed_at);
      if (number === null || number < 1 || !completedAt || seen.has(number)) continue;
      seen.add(number);
      const from = str(l.from, 10);
      const to = str(l.to, 10);
      laps.push({
        number,
        started_at: date(l.started_at),
        completed_at: completedAt,
        crossed_at: date(l.crossed_at),
        duration_ms: int(l.duration_ms),
        distance_m: num(l.distance_m),
        mean_radius_m: num(l.mean_radius_m),
        confidence: num(l.confidence),
        samples: int(l.samples),
        manual: l.manual === true,
        from_end: from && END.has(from) ? from : null,
        to_end: to && END.has(to) ? to : null,
      });
    }
    return laps;
  }

  /**
   * [timestamp_ms, lat, lng, accuracy, accepted] → rows numbered from `from`
   * (the app's index, so later uploads line up); malformed fixes are dropped.
   */
  private points(raw: unknown[], from: number): RitualSessionPointRow[] {
    const points: RitualSessionPointRow[] = [];
    for (const [i, p] of (raw ?? []).entries()) {
      if (!Array.isArray(p)) continue;
      const [t, lat, lng, accuracy, accepted] = p;
      const at = date(t);
      if (!at || num(lat) === null || num(lng) === null) continue;
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
      points.push({
        seq: from + i,
        recorded_at: at,
        lat,
        lng,
        accuracy: num(accuracy),
        accepted: accepted !== 0 && accepted !== false,
      });
    }
    return points;
  }

  private events(raw: Record<string, unknown>[] | undefined) {
    return (raw ?? [])
      .filter((e) => e && typeof e === 'object' && typeof e.type === 'string' && date(e.at))
      .map((e) => {
        const out: Record<string, unknown> = { type: String(e.type).slice(0, 30), at: date(e.at)!.toISOString() };
        if (e.value !== undefined && (typeof e.value === 'string' || typeof e.value === 'number')) out.value = e.value;
        return out;
      });
  }
}
