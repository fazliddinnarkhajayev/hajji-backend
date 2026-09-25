import { IsArray, IsIn, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CONTENT_LANGUAGES } from 'src/shared/constants';

export class RitualSubstepTranslationDto {
  @IsIn(CONTENT_LANGUAGES as unknown as string[])
  lang!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  dua_transliteration?: string;

  @IsOptional()
  @IsString()
  dua_translation?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class RitualSubstepDto {
  @IsOptional()
  @IsInt()
  sort_order?: number;

  @IsOptional()
  @IsString()
  dua_arabic?: string;

  @IsOptional()
  @IsString()
  audio_url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RitualSubstepTranslationDto)
  translations?: RitualSubstepTranslationDto[];
}
