import { IsUUID } from 'class-validator';

export class AddRoomMemberDto {
  @IsUUID()
  pilgrim_id: string;
}
