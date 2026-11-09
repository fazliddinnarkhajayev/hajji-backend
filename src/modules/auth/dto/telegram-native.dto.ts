import { IsIn, IsString, Length, Matches } from 'class-validator';
import type { NativePlatform } from '../telegram-login.service';

const PLATFORMS: NativePlatform[] = ['android', 'ios'];

/** POST /auth/telegram/native/start */
export class TelegramNativeStartDto {
  /** base64url SHA-256 of the app's code_verifier (PKCE S256). */
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  app_challenge!: string;

  @IsIn(PLATFORMS)
  platform!: NativePlatform;
}

/** POST /auth/telegram/native/exchange */
export class TelegramNativeExchangeDto {
  /** `code` from the App Link / Universal Link Telegram opened. */
  @IsString()
  @Length(1, 512)
  code!: string;

  /** The verifier whose challenge went to /native/start (RFC 7636: 43-128 chars). */
  @Matches(/^[A-Za-z0-9._~-]{43,128}$/)
  code_verifier!: string;

  @IsIn(PLATFORMS)
  platform!: NativePlatform;
}
