import { IsIn, IsOptional, IsString } from 'class-validator';
import { CONTENT_LANGUAGES } from 'src/shared/constants';

export class DuaTranslationDto {
  @IsIn(CONTENT_LANGUAGES as unknown as string[])
  lang!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  situation?: string;

  @IsOptional()
  @IsString()
  transliteration?: string;

  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  context?: string;
}
