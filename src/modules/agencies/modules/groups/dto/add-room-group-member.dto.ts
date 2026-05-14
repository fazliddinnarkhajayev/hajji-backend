import { IsUUID } from 'class-validator';

export class AddRoomGroupMemberDto {
  @IsUUID()
  pilgrim_id: string;
}
