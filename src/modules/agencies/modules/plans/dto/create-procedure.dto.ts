import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ConfirmationBy } from '../plans.dao';

export class CreateProcedureDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  day_index!: number;

  @IsString()
  title!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'meeting_time must be HH:mm format' })
  meeting_time!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_minutes!: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsBoolean()
  requires_confirmation!: boolean;

  @IsOptional()
  @IsEnum(['PILGRIM', 'GUIDE', 'BOTH'])
  confirmation_by?: ConfirmationBy;
}
