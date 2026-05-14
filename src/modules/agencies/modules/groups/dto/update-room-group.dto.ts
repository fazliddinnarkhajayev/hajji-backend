import { IsString, MinLength } from 'class-validator';

export class UpdateRoomGroupDto {
  @IsString()
  @MinLength(1)
  name: string;
}
