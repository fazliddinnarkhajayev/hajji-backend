import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateRegionDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  soato?: string;

  @IsOptional()
  @IsUUID()
  country_id?: string;
}
