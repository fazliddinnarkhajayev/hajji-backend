import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsString()
  name_ar: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsArray()
  coords: [number, number];
}
