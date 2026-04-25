import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddPilgrimToGroupDto {
  @IsUUID()
  @IsNotEmpty()
  group_id: string;

  @IsUUID()
  @IsNotEmpty()
  member_id: string;
}
