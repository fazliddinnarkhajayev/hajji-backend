import { IsString, IsOptional } from 'class-validator';

export class CreateDuaDto {
  @IsString()
  title!: string;

  @IsString()
  category!: string;

  @IsString()
  arabic!: string;

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
