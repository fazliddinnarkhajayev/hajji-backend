import { IsString, IsOptional, IsPhoneNumber, IsEmail, IsUUID, IsNotEmpty, IsIn, IsDateString, Matches, Length } from 'class-validator';

export class CreatePilgrimDto {
  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsUUID()
  country_id?: string;

  @IsOptional()
  @IsUUID()
  region_id?: string;

  @IsOptional()
  @IsUUID()
  district_id?: string;

  @IsOptional()
  @IsString()
  pinfl?: string;

  // ── Passport (typed or read from the MRZ) ──

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE';

  /** ISO 3166-1 alpha-3 as printed in the MRZ, e.g. UZB. */
  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  citizenship?: string;

  @IsOptional()
  @IsString()
  @Length(5, 20)
  passport_number?: string;

  @IsOptional()
  @IsDateString()
  passport_issued_at?: string;

  @IsOptional()
  @IsDateString()
  passport_expires_at?: string;
}
