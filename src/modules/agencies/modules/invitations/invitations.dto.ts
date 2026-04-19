import { IsUUID, IsOptional, IsString, IsEnum } from 'class-validator';
import { InvitationStatus } from './enums/invitation-status.enum';

export class CreateInvitationDto {
  @IsUUID()
  pilgrim_id: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class UpdateInvitationStatusDto {
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}

export class InvitationResponseDto {
  id: string;
  pilgrim_id: string;
  agency_id: string;
  invited_by: string;
  status: InvitationStatus;
  message?: string | null;
  expires_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
