import { IsOptional, IsString } from 'class-validator';

export class MobileConfirmProcedureDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
