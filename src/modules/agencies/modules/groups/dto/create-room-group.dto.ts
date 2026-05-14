import { IsString, MinLength } from 'class-validator';

export class CreateRoomGroupDto {
  @IsString()
  @MinLength(1)
  name: string;
}
