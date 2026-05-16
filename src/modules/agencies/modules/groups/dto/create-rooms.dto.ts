import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Min, MinLength, ValidateNested } from 'class-validator';

class RoomInputDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsInt()
  @Min(1)
  capacity: number;
}

export class CreateRoomsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoomInputDto)
  rooms: RoomInputDto[];
}
