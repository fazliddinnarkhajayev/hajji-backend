import { IsOptional, IsString } from 'class-validator';

export class UpdateDuaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  arabic?: string;

  @IsOptional()
  @IsString()
  transliteration?: string;

  @IsOptional()
  @IsString()
  translation?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  virtue?: string;

  @IsOptional()
  @IsString()
  audio_url?: string;
}
