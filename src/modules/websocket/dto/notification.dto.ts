import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class NotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  type?: string; // 'info', 'warning', 'error', 'success'

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  timestamp?: Date;
}
