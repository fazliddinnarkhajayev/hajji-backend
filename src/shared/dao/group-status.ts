import { TABLE_NAMES } from '../constants/table-names';

export const GROUP_STATUSES = ['FORMING', 'FORMED', 'IN_TRIP', 'TRIP_ENDED', 'CANCELLED'] as const;
export type GroupStatus = (typeof GROUP_STATUSES)[number];

/** Values older clients still send (staff app, agency-ui v1). */
export const LEGACY_GROUP_STATUSES = ['NEW', 'ACTIVE', 'COMPLETED'] as const;

export const VISA_STATUSES = ['NONE', 'SUBMITTED', 'ISSUED', 'REJECTED'] as const;
export const TICKET_STATUSES = ['NONE', 'BOOKED', 'ISSUED'] as const;

/**
 * Only "cancelled or not" is stored; everything else is derived. Any incoming status other than
 * CANCELLED (including the legacy NEW / ACTIVE / COMPLETED) means "not cancelled".
 */
export function storedGroupStatus(status?: string | null): 'FORMING' | 'CANCELLED' | undefined {
  if (status === undefined || status === null || status === '') return undefined;
  return status === 'CANCELLED' ? 'CANCELLED' : 'FORMING';
}

const GM = TABLE_NAMES.GROUP_MEMBERS;

/** SQL: members of group `g` whose visa or ticket is not finished yet. */
export const docsIncompleteCountSql = (g: string) =>
  `(SELECT COUNT(*)::int FROM ${GM} dm WHERE dm.group_id = ${g}.id AND (dm.visa_status <> 'ISSUED' OR dm.ticket_status <> 'ISSUED'))`;

export const membersCountSql = (g: string) =>
  `(SELECT COUNT(*)::int FROM ${GM} cm WHERE cm.group_id = ${g}.id)`;

/**
 * SQL: the effective status of group alias `g`.
 *   CANCELLED   stored by hand
 *   TRIP_ENDED  the day after return_date
 *   IN_TRIP     from departure_date (even if documents are missing — the trip is real)
 *   FORMED      has members and every member's visa and ticket are ISSUED
 *   FORMING     otherwise
 */
export const effectiveStatusSql = (g: string) => `(CASE
    WHEN ${g}.status = 'CANCELLED' THEN 'CANCELLED'
    WHEN CURRENT_DATE > ${g}.return_date::date THEN 'TRIP_ENDED'
    WHEN CURRENT_DATE >= ${g}.departure_date::date THEN 'IN_TRIP'
    WHEN ${membersCountSql(g)} > 0 AND ${docsIncompleteCountSql(g)} = 0 THEN 'FORMED'
    ELSE 'FORMING'
  END)`;
