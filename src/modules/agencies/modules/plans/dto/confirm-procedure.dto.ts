import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ConfirmProcedureDto {
  @IsEnum(['PILGRIM', 'GUIDE'])
  confirmed_by_type!: 'PILGRIM' | 'GUIDE';

  @IsOptional()
  @IsString()
  comment?: string;
}
