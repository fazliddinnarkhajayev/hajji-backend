import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
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

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly usersService?: UsersService,
  ) {
    this.usersService = usersService;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublicOnMethod = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
    const isPublicOnClass = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getClass());
    const isPublic = isPublicOnMethod || isPublicOnClass;
    
    if (isPublic) {
      return true;
    }

    // Get request
    const request = context.switchToHttp().getRequest();

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      throw new UnauthorizedException('Missing authorization header');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const secret = this.configService.get<string>('ACCESS_TOKEN_SECRET') || 'change_me_access';
      const payload = this.jwtService.verify<JwtPayload>(token, { secret });
      // Try to fetch full user data with related information
      try {
        if (this.usersService && typeof this.usersService.getCurrentUser === 'function') {
          const fullUser = await this.usersService.getCurrentUser(payload.user_id);
          request.user = fullUser || payload;
        } else {
          request.user = payload;
        }
      } catch (error) {
        console.log('Error fetching user details:', error);
        request.user = payload;
      }
      
      return true;
    } catch (error) {
      console.log('Error', error)
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
