import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationTranslationDto } from './location-translation.dto';

export class CreateLocationDto {
  @IsString()
  name_ar!: string;

  // Base/default name — optional; derived from translations when absent.
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsArray()
  coords?: [number, number];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationTranslationDto)
  translations?: LocationTranslationDto[];
}
