import { IsString, IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateGroupDto {
  @IsUUID()
  agency_id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  departure_date: Date;

  @IsDateString()
  return_date: Date;

  @IsOptional()
  @IsString()
  meeting_point?: string;

  @IsUUID()
  guide_pilgrim_id: string;
}
