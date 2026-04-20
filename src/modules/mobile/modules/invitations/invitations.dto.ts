import { IsEnum } from 'class-validator';
import { InvitationStatus } from 'src/modules/agencies/modules/invitations/enums/invitation-status.enum';

export class UpdateInvitationStatusDto {
  @IsEnum(InvitationStatus)
  status: InvitationStatus;
}

export class InvitationResponseDto {
  id: string;
  pilgrim_id: string;
  agency_id: string;
  agency: {
    id: string;
    name: string;
  };
  created_by_id: string;
  user: {
    id: string;
    username: string;
  };
  status: InvitationStatus;
  message?: string | null;
  expires_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}
