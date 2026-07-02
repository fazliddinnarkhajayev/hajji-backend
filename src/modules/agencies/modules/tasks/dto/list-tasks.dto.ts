import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'FLAGGED', 'CONTINUE', 'COMPLETED', 'CANCELLED', 'CANCELLED_ON_PROBLEM'] as const;
const SORT_FIELDS = ['created_at', 'updated_at'] as const;

export class ListTasksDto extends PaginationDto {
  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: (typeof TASK_STATUSES)[number];

  // Defaults to created_at (browsable order) in the service — updated_at is
  // opt-in for clients that want "most-recently-changed first" (e.g. a
  // dashboard-style task list).
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sort?: (typeof SORT_FIELDS)[number];
}
