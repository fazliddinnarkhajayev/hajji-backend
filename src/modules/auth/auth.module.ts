import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CoreModule } from '../../core/core.module';
import { UsersAuthDao } from '../../shared/dao/users-auth.dao';
import { AdminsDao } from '../../shared/dao/admins.dao';
import { OtpSessionsDao } from '../../shared/dao/otp-sessions.dao';
import { RefreshTokensDao } from '../../shared/dao/refresh-tokens.dao';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { AgencyUsersDao } from '../../modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [CoreModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, UsersAuthDao, AdminsDao, OtpSessionsDao, RefreshTokensDao, PilgrimsDao, AgencyUsersDao],
  exports: [AuthService],
})
export class AuthModule {}
