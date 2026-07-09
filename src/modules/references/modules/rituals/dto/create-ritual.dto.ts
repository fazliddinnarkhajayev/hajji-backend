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
import { RitualSubstepDto } from './ritual-substep.dto';

export class CreateRitualDto {
  @IsIn(['umrah', 'hajj'])
  type!: 'umrah' | 'hajj';

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

  // Per-language text. One entry per language the editor filled in.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RitualTranslationDto)
  translations?: RitualTranslationDto[];

  // Sub-steps (e.g. Tawaf circuits). When provided, they replace all existing
  // sub-steps of this ritual.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RitualSubstepDto)
  substeps?: RitualSubstepDto[];
}
