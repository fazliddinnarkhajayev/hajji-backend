import { IsUUID, IsNotEmpty } from 'class-validator';

export class AddPilgrimToGroupDto {
  @IsUUID()
  @IsNotEmpty()
  pilgrim_id: string;
}
