import { ArrayNotEmpty, IsArray, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoomDto {
  @IsIn(['dm', 'group'])
  type!: 'dm' | 'group';

  @IsOptional()
  @IsUUID()
  target_user_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  member_user_ids?: string[];
}
