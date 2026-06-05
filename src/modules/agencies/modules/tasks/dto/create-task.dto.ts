import { IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsUUID()
  assigned_to_id!: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsDateString()
  scheduled_time?: string;

  @IsOptional()
  @IsString()
  location_name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90) @Max(90)
  location_lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180) @Max(180)
  location_lng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(10) @Max(5000)
  location_radius_meters?: number;
}
