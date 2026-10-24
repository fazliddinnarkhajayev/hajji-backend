import { IsString, IsOptional, IsDate, IsIn } from 'class-validator';
import { GROUP_STATUSES, LEGACY_GROUP_STATUSES } from 'src/shared/dao/group-status';
import { Type } from 'class-transformer';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  guide_pilgrim_id?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  departure_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  return_date?: Date;

  @IsOptional()
  @IsString()
  meeting_point?: string;

  /** Only CANCELLED sticks; any other value (legacy NEW/ACTIVE/COMPLETED too) means "not cancelled". */
  @IsOptional()
  @IsIn([...GROUP_STATUSES, ...LEGACY_GROUP_STATUSES])
  status?: string;
}
