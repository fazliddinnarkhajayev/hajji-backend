import { IsIn, IsOptional, IsString } from 'class-validator';
import { CONTENT_LANGUAGES } from 'src/shared/constants';

export class RitualTranslationDto {
  @IsIn(CONTENT_LANGUAGES as unknown as string[])
  lang!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  dua_transliteration?: string;

  @IsOptional()
  @IsString()
  dua_translation?: string;
}
