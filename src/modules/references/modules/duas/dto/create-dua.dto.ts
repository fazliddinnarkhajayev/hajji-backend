import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DuaTranslationDto } from './dua-translation.dto';

export class CreateDuaDto {
  @IsString()
  category!: string;

  @IsString()
  arabic!: string;

  @IsOptional()
  @IsString()
  reference?: string;

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
  @Type(() => DuaTranslationDto)
  translations?: DuaTranslationDto[];
}
