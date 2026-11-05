import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { UserTypesEnum } from '../enums/user-types.enum';

/** The global JWT guard only proves a user is signed in; this one requires an admin. */
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    if (user?.type !== UserTypesEnum.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
