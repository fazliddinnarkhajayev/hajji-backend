import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AgencyUserRoleEnum } from 'src/shared/enums/agency-user-role.enum';

export class UpdateAgencyUserDto {
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
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(AgencyUserRoleEnum)
  role?: AgencyUserRoleEnum;
}
