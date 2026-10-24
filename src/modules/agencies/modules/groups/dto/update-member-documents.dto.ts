import { ArrayMaxSize, ArrayMinSize, IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';
import { TICKET_STATUSES, VISA_STATUSES } from 'src/shared/dao/group-status';

/** Visa / ticket fields of one membership. `null` clears a field. */
export class UpdateMemberDocumentsDto {
  @IsOptional()
  @IsIn(VISA_STATUSES as unknown as string[])
  visa_status?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(50)
  visa_number?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  visa_issued_at?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  visa_expires_at?: string | null;

  @IsOptional()
  @IsIn(TICKET_STATUSES as unknown as string[])
  ticket_status?: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(50)
  ticket_number?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(30)
  flight_number?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsDateString()
  flight_date?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(20)
  pnr?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(2000)
  documents_note?: string | null;
}

/** Same fields for many members at once (e.g. "whole group: ticket ISSUED, flight HY 621"). */
export class BulkUpdateMemberDocumentsDto extends UpdateMemberDocumentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID('all', { each: true })
  pilgrim_ids!: string[];
}
