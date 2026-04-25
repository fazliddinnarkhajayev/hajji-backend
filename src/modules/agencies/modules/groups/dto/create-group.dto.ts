import { IsString, IsDateString, IsOptional, IsEnum } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  guide_pilgrim_id: string;

  @IsDateString()
  departure_date: string;

  @IsDateString()
  return_date: string;

  @IsOptional()
  @IsString()
  meeting_point?: string;

  @IsOptional()
  @IsEnum(['NEW', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
  status?: 'NEW' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}
