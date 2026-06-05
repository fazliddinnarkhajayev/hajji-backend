import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  total_days!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  start_date!: string;
}
