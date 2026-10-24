import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
import { GROUP_STATUSES, LEGACY_GROUP_STATUSES } from 'src/shared/dao/group-status';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  guide_pilgrim_id: string;

  @IsDateString()
  departure_date: string;

  @IsDateString()
  return_date: string;

  @IsOptional()
  @IsString()
  meeting_point?: string;

  /** Only CANCELLED sticks; any other value (legacy NEW/ACTIVE/COMPLETED too) means "not cancelled". */
  @IsOptional()
  @IsIn([...GROUP_STATUSES, ...LEGACY_GROUP_STATUSES])
  status?: string;
}
