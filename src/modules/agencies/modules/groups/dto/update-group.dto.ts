import { IsString, IsOptional, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  guide_pilgrim_id?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  departure_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  return_date?: Date;

  @IsOptional()
  @IsString()
  meeting_point?: string;

  @IsOptional()
  @IsEnum(['NEW', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: 'NEW' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}
