import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RitualTranslationDto } from './ritual-translation.dto';

export class UpdateRitualDto {
  @IsOptional()
  @IsIn(['umrah', 'hajj'])
  type?: 'umrah' | 'hajj';

  @IsOptional()
  @IsString()
  arabic?: string;

  @IsOptional()
  @IsString()
  dua_arabic?: string;

  @IsOptional()
  @IsString()
  audio_url?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;

  // When provided, each entry is upserted for its language. Languages not
  // included are left untouched.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RitualTranslationDto)
  translations?: RitualTranslationDto[];
}
