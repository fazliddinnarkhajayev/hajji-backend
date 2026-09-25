import { IsUUID } from 'class-validator';

export class ReassignTaskDto {
  @IsUUID()
  assigned_to_id!: string;
}
