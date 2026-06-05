import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/is-public.decorator';
import { UsersService } from 'src/modules/users/users.service';

export interface JwtPayload {
  user_id: string;
  phone?: string;
  role?: string;
  type?: 'ADMIN' | 'PILGRIM' | 'AGENCY_USER';
  agency_id?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly usersService?: UsersService,
  ) {
    this.usersService = usersService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicOnMethod = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    const isPublicOnClass = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getClass());
    const isPublic = isPublicOnMethod || isPublicOnClass;

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      this.logger.warn(`[${method} ${url}] Missing authorization header`);
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    if (!token) {
      this.logger.warn(`[${method} ${url}] Empty token after Bearer prefix`);
      throw new UnauthorizedException('Missing token');
    }

    try {
      const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET') || 'change_me_access';
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });

      // payload already contains user_id, type, role, agency_id (for AGENCY_USER)
      request.user = payload;

      // Optionally enrich with full user data if UsersService is available
      try {
        if (this.usersService && typeof this.usersService.getCurrentUser === 'function') {
          const fullUser = await this.usersService.getCurrentUser(payload.user_id);
          if (fullUser) {
            // Merge: keep JWT fields (agency_id, role) as primary source of truth
            request.user = { ...payload, ...fullUser };
          }
        }
      } catch (error) {
        this.logger.warn(`[${method} ${url}] Failed to enrich user details, using JWT payload. Error: ${error.message}`);
      }

      return true;
    } catch (error) {
      this.logger.warn(
        `[${method} ${url}] Token verification failed — name=${error.name} message=${error.message}` +
        (error.expiredAt ? ` expiredAt=${error.expiredAt.toISOString()}` : ''),
      );
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
