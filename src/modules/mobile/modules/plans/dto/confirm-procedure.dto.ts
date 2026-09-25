import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class MobileConfirmProcedureDto {
  @IsOptional()
  @IsString()
  comment?: string;

  /** When the user confirmed on the device (offline confirmations are sent later). */
  @IsOptional()
  @IsISO8601()
  confirmed_at?: string;
}
