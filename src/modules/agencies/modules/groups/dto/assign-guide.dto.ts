import { IsUUID } from 'class-validator';

export class AssignGuideDto {
  @IsUUID()
  guide_pilgrim_id!: string;
}
