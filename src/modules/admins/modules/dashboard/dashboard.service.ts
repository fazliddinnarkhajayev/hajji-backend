import { Injectable } from '@nestjs/common';
import { GROUP_STATUSES, VISA_STATUSES } from 'src/shared/dao/group-status';
import { AdminDashboardDao } from './dashboard.dao';

/** Every known key, with 0 for the ones the query didn't return. */
const countsBy = <K extends string>(keys: readonly K[], rows: { status: string; count: number }[]) =>
  Object.fromEntries(keys.map((k) => [k, rows.find((r) => r.status === k)?.count ?? 0])) as Record<K, number>;

@Injectable()
export class AdminDashboardService {
  constructor(private readonly dao: AdminDashboardDao) {}

  /** Everything the admin dashboard shows, in one response so the numbers agree with each other. */
  async get() {
    const [pilgrims, agencies, groups, visas] = await Promise.all([
      this.dao.pilgrims(),
      this.dao.agencies(),
      this.dao.groups(),
      this.dao.visas(),
    ]);
    return {
      pilgrims,
      agencies,
      groups: { by_status: countsBy(GROUP_STATUSES, groups.statuses), departures: groups.departures },
      visas: countsBy(VISA_STATUSES, visas),
    };
  }
}
