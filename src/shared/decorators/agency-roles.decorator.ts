import { SetMetadata } from '@nestjs/common';
import { AgencyUserRoleEnum } from '../enums/agency-user-role.enum';

export const AGENCY_ROLES_KEY = 'agencyRoles';

/** Restricts a route (or controller) to agency users with one of the given roles. */
export const AgencyRoles = (...roles: AgencyUserRoleEnum[]) => SetMetadata(AGENCY_ROLES_KEY, roles);
