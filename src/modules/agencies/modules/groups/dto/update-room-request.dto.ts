import { IsString, MinLength } from 'class-validator';

export class UpdateRoomRequestDto {
  @IsString()
  @MinLength(1)
  name: string;
}
