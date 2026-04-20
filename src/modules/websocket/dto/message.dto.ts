import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class MessageDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  timestamp?: Date;
}
