import { IsString, IsOptional, IsPhoneNumber, IsEmail, IsUUID } from 'class-validator';

export class UpdatePilgrimDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;

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
}
