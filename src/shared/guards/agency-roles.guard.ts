import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AGENCY_ROLES_KEY } from '../decorators/agency-roles.decorator';
import { AgencyUserRoleEnum } from '../enums/agency-user-role.enum';

/**
 * Checks @AgencyRoles() metadata. Runs after the global JwtAuthGuard, so request.user is set.
 * The current role from agency_users wins over the role baked into the JWT.
 */
@Injectable()
export class AgencyRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AgencyUserRoleEnum[]>(AGENCY_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) return true;

    const user = context.switchToHttp().getRequest().user;
    const role = user?.agencyUser?.role ?? user?.role;
    if (!role || !roles.includes(role)) {
      throw new ForbiddenException('Insufficient role for this action');
    }
    return true;
  }
}
