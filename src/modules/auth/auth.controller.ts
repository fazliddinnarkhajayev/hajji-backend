import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { TelegramLoginService } from './telegram-login.service';
import { TelegramExchangeDto } from './dto/telegram-exchange.dto';
import { TelegramNativeExchangeDto, TelegramNativeStartDto } from './dto/telegram-native.dto';
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
  constructor(
    private readonly authService: AuthService,
    private readonly telegramLogin: TelegramLoginService,
  ) {}

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

  // ===================== Log In With Telegram (OIDC) =====================

  /** Opened by the app in the system browser; redirects to Telegram. */
  @IsPublic()
  @Get('telegram/start')
  telegramStart(
    @Query('app_challenge') appChallenge: string,
    @Query('return_to') returnTo: string,
    @Res() res: Response,
  ) {
    // Browser build passes its origin; only whitelisted origins are honoured.
    const webOrigin = this.telegramLogin.allowedWebOrigin(returnTo);
    try {
      res.redirect(302, this.telegramLogin.buildAuthUrl(appChallenge, webOrigin));
    } catch (err: any) {
      this.sendAppRedirect(res, { error: err?.message || 'start_failed' }, webOrigin);
    }
  }

  /** Telegram redirects here (registered as an Allowed URL in @BotFather). */
  @IsPublic()
  @Get('telegram/callback')
  async telegramCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const webOrigin = this.telegramLogin.returnToFor(state);
    if (error || !code || !state) {
      return this.sendAppRedirect(res, { error: error || 'cancelled' }, webOrigin);
    }
    try {
      const ticket = await this.telegramLogin.handleCallback(code, state);
      return this.sendAppRedirect(res, { ticket }, webOrigin);
    } catch (err: any) {
      return this.sendAppRedirect(res, { error: err?.message || 'login_failed' }, webOrigin);
    }
  }

  /** App redeems the deep-link ticket for tokens (or a register handoff). */
  @IsPublic()
  @Post('telegram/exchange')
  async telegramExchange(@Body() dto: TelegramExchangeDto) {
    const identity = this.telegramLogin.redeemTicket(dto.ticket, dto.app_verifier);
    return this.authService.loginWithTelegram(identity);
  }

  /** Native login, step 1: the tg:// link that opens the consent screen in the Telegram app. */
  @IsPublic()
  @Post('telegram/native/start')
  telegramNativeStart(@Body() dto: TelegramNativeStartDto) {
    return this.telegramLogin.nativeStart(dto.app_challenge, dto.platform);
  }

  /** Native login, step 2: code from the App Link + the app's PKCE verifier -> tokens / register handoff. */
  @IsPublic()
  @Post('telegram/native/exchange')
  async telegramNativeExchange(@Body() dto: TelegramNativeExchangeDto) {
    const identity = await this.telegramLogin.nativeExchange(dto.code, dto.code_verifier, dto.platform);
    return this.authService.loginWithTelegram(identity);
  }

  /**
   * Hands control back to the app via its deep link. Served as a tiny HTML
   * page (auto-redirect + button) because some browsers block a bare 302 to a
   * custom scheme without a user gesture.
   */
  private sendAppRedirect(res: Response, params: Record<string, string>, webOrigin?: string) {
    // Browser build: plain redirect back to the web app with tg_* params.
    if (webOrigin) {
      const q = new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [`tg_${k}`, v])),
      );
      return res.redirect(302, `${webOrigin}/?${q.toString()}`);
    }
    const url = `${this.telegramLogin.appRedirect}?${new URLSearchParams(params).toString()}`;
    const safe = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    res
      .status(200)
      .type('html')
      .send(
        `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
          `<title>Hajji Guide</title><meta http-equiv="refresh" content="0;url=${safe}"></head>` +
          `<body style="font-family:system-ui,sans-serif;text-align:center;padding:48px 24px">` +
          `<p>Hajji Guide…</p><p><a href="${safe}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#1B6B3A;color:#fff;text-decoration:none;font-weight:700">Ilovaga qaytish / Вернуться в приложение</a></p>` +
          `<script>location.replace(${JSON.stringify(url).replace(/</g, '\\u003c')});</script></body></html>`,
      );
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
