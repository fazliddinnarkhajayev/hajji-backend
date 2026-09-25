import { IsIn, IsOptional, IsString } from 'class-validator';
import { CONTENT_LANGUAGES } from 'src/shared/constants';

export class LocationTranslationDto {
  @IsIn(CONTENT_LANGUAGES as unknown as string[])
  lang!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
