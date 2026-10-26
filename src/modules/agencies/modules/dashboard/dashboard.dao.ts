import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants/table-names';
import { effectiveStatusSql, membersCountSql, GroupStatus } from 'src/shared/dao/group-status';

const G = TABLE_NAMES.GROUPS;
const GM = TABLE_NAMES.GROUP_MEMBERS;
const P = TABLE_NAMES.PILGRIMS;

/** Calendar day of a stored (UTC, without zone) timestamp in the agency's zone `tz`. */
const localDay = (col: string) => `(${col} AT TIME ZONE 'UTC' AT TIME ZONE prm.tz)::date`;

/** A passport is good for a trip when it is entered and valid for 6 months after the return. */
const passportOk = (p: string, g: string) =>
  `(NULLIF(TRIM(${p}.passport_number), '') IS NOT NULL AND ${p}.passport_expires_at IS NOT NULL
    AND ${p}.passport_expires_at >= (${localDay(`${g}.return_date`)} + INTERVAL '6 months')::date)`;

export interface DashboardGroupRow {
  id: string;
  name: string;
  departure_date: Date;
  return_date: Date;
  /** YYYY-MM-DD in the requested zone. */
  departure_day: string;
  return_day: string;
  status: GroupStatus;
  members_count: number;
  ready_count: number;
  guide_name: string | null;
}

/**
 * Read-only aggregates for the agency dashboard. Every query takes the agency and the zone
 * (`tz`, IANA name) the days are counted in; the server itself runs in UTC.
 */
@Injectable()
export class DashboardDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private params(tz: string) {
    return this.db.raw(`SELECT ?::text AS tz, (now() AT TIME ZONE ?)::date AS today`, [tz, tz]);
  }

  /** Every live group with its effective status, size and how many members' passports are ready. */
  async groups(agencyId: string, tz: string): Promise<DashboardGroupRow[]> {
    const { rows } = await this.db.raw(
      `WITH prm AS (${this.params(tz).toQuery()})
       SELECT g.id, g.name, g.departure_date, g.return_date,
              ${localDay('g.departure_date')}::text AS departure_day,
              ${localDay('g.return_date')}::text AS return_day,
              ${effectiveStatusSql('g')} AS status,
              ${membersCountSql('g')} AS members_count,
              (SELECT COUNT(*)::int FROM ${GM} m JOIN ${P} mp ON mp.id = m.pilgrim_id
                WHERE m.group_id = g.id AND ${passportOk('mp', 'g')}) AS ready_count,
              NULLIF(TRIM(CONCAT_WS(' ', gp.first_name, gp.last_name)), '') AS guide_name
         FROM ${G} g
         CROSS JOIN prm
         LEFT JOIN ${P} gp ON gp.id = g.guide_pilgrim_id
        WHERE g.agency_id = ? AND g.is_deleted = false AND g.deleted_at IS NULL`,
      [agencyId],
    );
    return rows;
  }

  /** Passports of the members of groups that haven't ended (one row per membership). */
  async passports(agencyId: string, tz: string) {
    const { rows } = await this.db.raw(
      `WITH prm AS (${this.params(tz).toQuery()})
       SELECT COUNT(*)::int AS members,
              COUNT(*) FILTER (WHERE NULLIF(TRIM(p.passport_number), '') IS NULL OR p.passport_expires_at IS NULL)::int AS missing,
              COUNT(*) FILTER (WHERE NULLIF(TRIM(p.passport_number), '') IS NOT NULL AND p.passport_expires_at < prm.today)::int AS expired,
              COUNT(*) FILTER (WHERE NULLIF(TRIM(p.passport_number), '') IS NOT NULL AND p.passport_expires_at >= prm.today
                                 AND NOT ${passportOk('p', 'g')})::int AS short,
              COUNT(*) FILTER (WHERE ${passportOk('p', 'g')})::int AS valid,
              COUNT(DISTINCT g.id) FILTER (WHERE NULLIF(TRIM(p.passport_number), '') IS NOT NULL
                                 AND p.passport_expires_at IS NOT NULL AND NOT ${passportOk('p', 'g')})::int AS short_groups
         FROM ${GM} m
         JOIN ${G} g ON g.id = m.group_id
         JOIN ${P} p ON p.id = m.pilgrim_id
         CROSS JOIN prm
        WHERE g.agency_id = ? AND g.is_deleted = false AND g.deleted_at IS NULL
          AND ${effectiveStatusSql('g')} IN ('FORMING', 'FORMED', 'IN_TRIP')`,
      [agencyId],
    );
    return rows[0] as { members: number; missing: number; expired: number; short: number; valid: number; short_groups: number };
  }

  /** Totals, members of no group, and the last 12 months of sign-ups (months in `tz`). */
  async pilgrims(agencyId: string, tz: string) {
    const base = `p.agency_id = ? AND p.is_deleted = false AND p.deleted_at IS NULL`;
    const noGroup = `NOT EXISTS (SELECT 1 FROM ${GM} m WHERE m.pilgrim_id = p.id)`;
    const [totals, months] = await Promise.all([
      this.db.raw(
        `WITH prm AS (${this.params(tz).toQuery()})
         SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE ${noGroup})::int AS no_group,
                COUNT(*) FILTER (WHERE ${noGroup} AND p.created_at < now() AT TIME ZONE 'UTC' - INTERVAL '30 days')::int AS no_group_30d,
                COUNT(*) FILTER (WHERE date_trunc('month', ${localDay('p.created_at')}) = date_trunc('month', prm.today))::int AS this_month
           FROM ${P} p CROSS JOIN prm
          WHERE ${base}`,
        [agencyId],
      ),
      this.db.raw(
        `WITH prm AS (${this.params(tz).toQuery()}),
              c AS (SELECT date_trunc('month', ${localDay('p.created_at')})::date AS m, COUNT(*)::int AS n
                      FROM ${P} p CROSS JOIN prm WHERE ${base} GROUP BY 1)
         SELECT to_char(s.m, 'YYYY-MM') AS month, COALESCE(c.n, 0)::int AS count
           FROM generate_series(
                  (SELECT date_trunc('month', today) FROM prm) - INTERVAL '11 months',
                  (SELECT date_trunc('month', today) FROM prm),
                  INTERVAL '1 month') AS s(m)
           LEFT JOIN c ON c.m = s.m::date
          ORDER BY s.m`,
        [agencyId],
      ),
    ]);
    return { ...(totals.rows[0] as { total: number; no_group: number; no_group_30d: number; this_month: number }), months: months.rows as { month: string; count: number }[] };
  }

  /** Open tasks past their scheduled time, agency-wide. */
  async overdueTasks(agencyId: string) {
    const row = await this.db(TABLE_NAMES.TASKS)
      .where({ agency_id: agencyId, is_deleted: false })
      .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'CANCELLED_ON_PROBLEM'])
      .whereNotNull('scheduled_time')
      .where('scheduled_time', '<', this.db.fn.now())
      .first(this.db.raw('COUNT(*)::int AS count'), this.db.raw('MIN(scheduled_time) AS oldest'));
    return row as unknown as { count: number; oldest: Date | null };
  }

  /** Invitations still waiting for the pilgrim, and those waiting more than 3 days. */
  async pendingInvitations(agencyId: string) {
    const row = await this.db(TABLE_NAMES.INVITATIONS)
      .where({ agency_id: agencyId, status: 'PENDING' })
      .first(
        this.db.raw('COUNT(*)::int AS count'),
        this.db.raw(`COUNT(*) FILTER (WHERE created_at < now() AT TIME ZONE 'UTC' - INTERVAL '3 days')::int AS older_3d`),
      );
    return row as unknown as { count: number; older_3d: number };
  }

  /**
   * Latest events across the agency, newest first: sign-ups, answered invitations, new groups and
   * completed tasks. Built from the tables themselves, there is no separate activity log.
   */
  async recent(agencyId: string, limit: number) {
    const name = (p: string) => `NULLIF(TRIM(CONCAT_WS(' ', ${p}.first_name, ${p}.last_name)), '')`;
    const { rows } = await this.db.raw(
      `SELECT * FROM (
         SELECT 'PILGRIM_CREATED' AS type, p.id AS ref_id, ${name('p')} AS name, p.created_at AS at
           FROM ${P} p
          WHERE p.agency_id = :a AND p.is_deleted = false AND p.deleted_at IS NULL
         UNION ALL
         SELECT 'INVITATION_' || i.status, i.pilgrim_id, ${name('ip')}, i.updated_at
           FROM ${TABLE_NAMES.INVITATIONS} i JOIN ${P} ip ON ip.id = i.pilgrim_id
          WHERE i.agency_id = :a AND i.status IN ('ACCEPTED', 'REJECTED')
         UNION ALL
         SELECT 'GROUP_CREATED', g.id, g.name, g.created_at
           FROM ${G} g
          WHERE g.agency_id = :a AND g.is_deleted = false AND g.deleted_at IS NULL
         UNION ALL
         SELECT 'TASK_COMPLETED', t.id, t.title, t.completed_at
           FROM ${TABLE_NAMES.TASKS} t
          WHERE t.agency_id = :a AND t.is_deleted = false AND t.status = 'COMPLETED' AND t.completed_at IS NOT NULL
       ) e
       WHERE e.at IS NOT NULL
       ORDER BY e.at DESC
       LIMIT :limit`,
      { a: agencyId, limit },
    );
    return rows as { type: string; ref_id: string; name: string | null; at: Date }[];
  }
}
