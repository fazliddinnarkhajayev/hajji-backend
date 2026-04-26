import { IsIn, IsString, IsPhoneNumber, IsOptional, MinLength, ValidateIf } from 'class-validator';

export class RegisterDto {
  @IsIn(['MANUAL', 'GOOGLE'])
  type!: 'MANUAL' | 'GOOGLE';

  @ValidateIf((dto) => dto.type === 'MANUAL')
  @IsString()
  @MinLength(1)
  first_name?: string;

  @ValidateIf((dto) => dto.type === 'MANUAL')
  @IsString()
  @MinLength(1)
  last_name?: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @ValidateIf((dto) => dto.type === 'MANUAL')
  @IsPhoneNumber()
  phone?: string;

  @ValidateIf((dto) => dto.type === 'MANUAL')
  @IsString()
  @MinLength(1)
  country_id?: string;

  @IsOptional()
  @IsString()
  region_id?: string;

  @IsOptional()
  @IsString()
  district_id?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @ValidateIf((dto) => dto.type === 'GOOGLE')
  @IsString()
  @MinLength(1)
  google_token?: string;
}
