import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===================== Admin Login =====================

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  // ===================== Pilgrim OTP Flow =====================

  @Post('send-otp')
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const data = await this.authService.verifyOtp(dto);
    return data;
  }

  // ===================== Pilgrim Registration =====================

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registerPilgrim(dto);
  }

  // ===================== Token Management =====================

  @Post('refresh-token')
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  async logout(@Body() dto: LogoutDto) {
    return this.authService.logout(dto);
  }
}
