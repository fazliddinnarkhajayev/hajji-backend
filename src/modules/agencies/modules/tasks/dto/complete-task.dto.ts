import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CompleteTaskDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90) @Max(90)
  completed_lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180) @Max(180)
  completed_lng?: number;

  @IsOptional()
  @IsString()
  completed_comment?: string;
}
