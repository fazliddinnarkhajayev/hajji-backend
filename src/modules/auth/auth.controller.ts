import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { AgencyResetPasswordDto } from './dto/agency-reset-password.dto';
import { IsPublic } from 'src/shared/decorators';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { JwtPayload } from 'src/shared/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===================== Admin Login =====================

  @IsPublic()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  // ===================== Agency User Login =====================

  @IsPublic()
  @Post('agency-login')
  async agencyLogin(@Body() dto: LoginDto) {
    return this.authService.agencyLogin(dto);
  }

  @Post('agency-reset-password')
  async agencyResetPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AgencyResetPasswordDto,
  ) {
    return this.authService.agencyResetPassword(user, dto);
  }

  // ===================== Pilgrim OTP Flow =====================

  @IsPublic()
  @Post('send-otp')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @IsPublic()
  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.authService.verifyOtp(dto);
    return data;
  }

  // ===================== Pilgrim Registration =====================

  @IsPublic()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerPilgrim(dto);
  }

  // ===================== Token Management =====================

  @IsPublic()
  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }
}
