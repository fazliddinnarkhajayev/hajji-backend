import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfirmationBy } from '../plans.dao';

export class UpdateProcedureDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'meeting_time must be HH:mm format' })
  meeting_time?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  requires_confirmation?: boolean;

  @IsOptional()
  @IsEnum(['PILGRIM', 'GUIDE', 'BOTH'])
  confirmation_by?: ConfirmationBy;
}
