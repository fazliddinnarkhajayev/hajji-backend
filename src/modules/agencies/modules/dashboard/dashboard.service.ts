import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DashboardDao, DashboardGroupRow } from './dashboard.dao';
import { GROUP_STATUSES, GroupStatus } from 'src/shared/dao/group-status';

export const DEFAULT_TZ = 'Asia/Tashkent';
/** "Upcoming" departures: from today up to this many days ahead. */
const UPCOMING_DAYS = 60;
const UPCOMING_LIMIT = 5;
const RECENT_LIMIT = 8;

/** YYYY-MM-DD of `date` in zone `tz`. */
function dayIn(tz: string, date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function addDays(day: string, n: number) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

@Injectable()
export class DashboardService {
  constructor(private readonly dao: DashboardDao) {}

  /**
   * Everything the agency dashboard shows, agency-wide (no per-role narrowing), in one response so
   * the numbers agree with each other. Days ("today", departure days) are counted in `tz`.
   * Visa and ticket figures are left out for now: those features aren't live yet, so "ready"
   * means the passport is entered and valid 6 months after the return.
   */
  async get(user: any, tzParam?: string) {
    const agencyId: string | undefined = user?.agency_id;
    if (!agencyId) throw new ForbiddenException('Agency users only');
    const tz = tzParam ? String(tzParam) : DEFAULT_TZ;
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
    } catch {
      throw new BadRequestException('Unknown time zone');
    }

    const [groups, passports, pilgrims, tasks, invitations, recent] = await Promise.all([
      this.dao.groups(agencyId, tz),
      this.dao.passports(agencyId, tz),
      this.dao.pilgrims(agencyId, tz),
      this.dao.overdueTasks(agencyId),
      this.dao.pendingInvitations(agencyId),
      this.dao.recent(agencyId, RECENT_LIMIT),
    ]);

    const today = dayIn(tz);
    const horizon = addDays(today, UPCOMING_DAYS);
    const brief = (g: DashboardGroupRow) => ({
      id: g.id,
      name: g.name,
      departure_date: g.departure_date,
      return_date: g.return_date,
      departure_day: g.departure_day,
      return_day: g.return_day,
      status: g.status,
      members_count: g.members_count,
      ready_count: g.ready_count,
      guide_name: g.guide_name,
    });
    const byDeparture = (a: DashboardGroupRow, b: DashboardGroupRow) => a.departure_day.localeCompare(b.departure_day);

    const preparing = groups
      .filter((g) => (g.status === 'FORMING' || g.status === 'FORMED') && g.departure_day >= today)
      .sort(byDeparture);
    const upcoming = preparing.filter((g) => g.departure_day <= horizon);
    const next = preparing.find((g) => g.members_count > 0) ?? preparing[0] ?? null;
    const inTrip = groups.filter((g) => g.status === 'IN_TRIP').sort(byDeparture);
    const empty = preparing.filter((g) => g.members_count === 0);

    const byStatus = Object.fromEntries(GROUP_STATUSES.map((s) => [s, { groups: 0, members: 0 }])) as Record<GroupStatus, { groups: number; members: number }>;
    for (const g of groups) {
      byStatus[g.status].groups += 1;
      byStatus[g.status].members += g.members_count;
    }

    return {
      generated_at: new Date().toISOString(),
      tz,
      today,
      in_trip: {
        members: inTrip.reduce((n, g) => n + g.members_count, 0),
        trips: inTrip.map(brief),
      },
      next_departure: next ? { ...brief(next), not_ready: next.members_count - next.ready_count } : null,
      readiness: {
        window_days: UPCOMING_DAYS,
        ready: upcoming.reduce((n, g) => n + g.ready_count, 0),
        total: upcoming.reduce((n, g) => n + g.members_count, 0),
      },
      upcoming: upcoming.slice(0, UPCOMING_LIMIT).map(brief),
      upcoming_count: upcoming.length,
      pilgrims,
      documents: {
        members: passports.members,
        passport: { valid: passports.valid, short: passports.short, expired: passports.expired, missing: passports.missing },
      },
      groups: byStatus,
      alerts: {
        next_not_ready: next ? next.members_count - next.ready_count : 0,
        tasks_overdue: { count: tasks.count, oldest: tasks.oldest },
        passports_short: { count: passports.short + passports.expired, groups: passports.short_groups },
        no_group: { count: pilgrims.no_group, older_30d: pilgrims.no_group_30d },
        invitations_pending: { count: invitations.count, older_3d: invitations.older_3d },
        empty_groups: { count: empty.length, first: empty[0] ? brief(empty[0]) : null },
      },
      recent,
    };
  }
}
