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
  role?: 'PILGRIM' | 'STAFF' | 'SUPER_ADMIN';
  type?: 'ADMIN' | 'PILGRIM';
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

      try {
        if (this.usersService && typeof this.usersService.getCurrentUser === 'function') {
          const fullUser = await this.usersService.getCurrentUser(payload.user_id);
          request.user = fullUser || payload;
        } else {
          request.user = payload;
        }
      } catch (error) {
        this.logger.warn(`[${method} ${url}] Failed to fetch user details for user_id=${payload.user_id}: ${error.message}`);
        request.user = payload;
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
