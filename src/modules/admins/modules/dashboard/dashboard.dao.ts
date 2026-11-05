import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants/table-names';
import { effectiveStatusSql } from 'src/shared/dao/group-status';

const A = TABLE_NAMES.AGENCIES;
const G = TABLE_NAMES.GROUPS;
const GM = TABLE_NAMES.GROUP_MEMBERS;
const P = TABLE_NAMES.PILGRIMS;

const TZ = 'Asia/Tashkent';
const NOW = `(now() AT TIME ZONE '${TZ}')`;
/** A timestamptz column as wall-clock time in the platform's zone. */
const local = (col: string) => `(${col} AT TIME ZONE '${TZ}')`;
const sameMonth = (col: string) => `date_trunc('month', ${local(col)}) = date_trunc('month', ${NOW})`;

const LIVE_PILGRIM = `p.is_deleted = false AND p.deleted_at IS NULL`;
const LIVE_AGENCY = `a.is_deleted = false AND a.deleted_at IS NULL`;
const LIVE_GROUP = `g.is_deleted = false AND g.deleted_at IS NULL`;

export interface MonthCount {
  /** YYYY-MM */
  month: string;
  count: number;
}

/** Read-only aggregates for the admin dashboard, across all agencies. */
@Injectable()
export class AdminDashboardDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  /** The last 12 months including this one; months without rows come back as 0. */
  private async lastYear(column: string, from: string): Promise<MonthCount[]> {
    const { rows } = await this.db.raw(
      `WITH c AS (SELECT date_trunc('month', ${local(column)})::date AS m, COUNT(*)::int AS n FROM ${from} GROUP BY 1)
       SELECT to_char(s.m, 'YYYY-MM') AS month, COALESCE(c.n, 0)::int AS count
         FROM generate_series(
                date_trunc('month', ${NOW}) - INTERVAL '11 months',
                date_trunc('month', ${NOW}),
                INTERVAL '1 month') AS s(m)
         LEFT JOIN c ON c.m = s.m::date
        ORDER BY s.m`,
    );
    return rows;
  }

  async pilgrims() {
    const [totals, onTrip, months] = await Promise.all([
      this.db.raw(
        `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE ${sameMonth('p.created_at')})::int AS this_month
           FROM ${P} p WHERE ${LIVE_PILGRIM}`,
      ),
      this.db.raw(
        `SELECT COUNT(DISTINCT m.pilgrim_id)::int AS on_trip
           FROM ${GM} m JOIN ${G} g ON g.id = m.group_id
          WHERE ${LIVE_GROUP} AND ${effectiveStatusSql('g')} = 'IN_TRIP'`,
      ),
      this.lastYear('p.created_at', `${P} p WHERE ${LIVE_PILGRIM}`),
    ]);
    return { ...(totals.rows[0] as { total: number; this_month: number }), on_trip: onTrip.rows[0].on_trip as number, months };
  }

  /** `total` leaves out requests that were never accepted. */
  async agencies() {
    const { rows } = await this.db.raw(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE ${sameMonth('a.created_at')})::int AS this_month
         FROM ${A} a WHERE ${LIVE_AGENCY} AND a.status NOT IN ('PENDING', 'REJECTED')`,
    );
    return rows[0] as { total: number; this_month: number };
  }

  async groups() {
    const [statuses, departures] = await Promise.all([
      this.db.raw(`SELECT ${effectiveStatusSql('g')} AS status, COUNT(*)::int AS count FROM ${G} g WHERE ${LIVE_GROUP} GROUP BY 1`),
      this.lastYear('g.departure_date', `${G} g WHERE ${LIVE_GROUP} AND g.status <> 'CANCELLED'`),
    ]);
    return { statuses: statuses.rows as { status: string; count: number }[], departures };
  }

  /** Visa status of every membership in a group that wasn't cancelled. */
  async visas() {
    const { rows } = await this.db.raw(
      `SELECT m.visa_status AS status, COUNT(*)::int AS count
         FROM ${GM} m JOIN ${G} g ON g.id = m.group_id
        WHERE ${LIVE_GROUP} AND g.status <> 'CANCELLED'
        GROUP BY 1`,
    );
    return rows as { status: string; count: number }[];
  }
}
