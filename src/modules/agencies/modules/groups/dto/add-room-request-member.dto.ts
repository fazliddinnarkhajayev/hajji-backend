import { IsUUID } from 'class-validator';

export class AddRoomRequestMemberDto {
  @IsUUID()
  pilgrim_id: string;
}
