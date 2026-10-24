import { IsString, IsOptional, IsPhoneNumber, IsEmail, IsUUID, IsIn, IsDateString, Matches, Length, ValidateIf, IsNotEmpty } from 'class-validator';

/**
 * Every CreatePilgrimDto field, all optional. `null` clears an optional field.
 * A new phone also becomes the pilgrim's login (users.username).
 */
export class UpdatePilgrimDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  first_name?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  last_name?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  middle_name?: string | null;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsEmail()
  email?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  country_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  region_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsUUID()
  district_id?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  pinfl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  birth_date?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsIn(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE' | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Matches(/^[A-Z]{3}$/)
  citizenship?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @Length(5, 20)
  passport_number?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  passport_issued_at?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  passport_expires_at?: string | null;
}
