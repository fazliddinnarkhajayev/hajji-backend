import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AgencyUserRoleEnum } from 'src/shared/enums/agency-user-role.enum';

export class CreateAgencyUserDto {
  @IsString()
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsString()
  phone!: string;

  @IsEnum(AgencyUserRoleEnum)
  role!: AgencyUserRoleEnum;
}
