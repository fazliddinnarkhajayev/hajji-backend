import { IsOptional, IsUUID } from 'class-validator';

export class AssignManagerDto {
  @IsUUID()
  manager_id!: string;

  @IsOptional()
  @IsUUID()
  supervisor_id?: string;
}
