import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DuaTranslationDto } from './dua-translation.dto';

export class UpdateDuaDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  arabic?: string;

  @IsOptional()
  @IsString()
  reference?: string;

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
  @Type(() => DuaTranslationDto)
  translations?: DuaTranslationDto[];
}
