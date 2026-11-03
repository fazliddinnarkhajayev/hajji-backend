import { IsString, Length } from 'class-validator';

export class TelegramExchangeDto {
  @IsString()
  ticket!: string;

  /** Raw secret whose SHA-256 (base64url) was sent as app_challenge to /auth/telegram/start. */
  @IsString()
  @Length(43, 128)
  app_verifier!: string;
}
