import { IsString, MinLength } from 'class-validator';

export class CreateRoomRequestDto {
  @IsString()
  @MinLength(1)
  name: string;
}
