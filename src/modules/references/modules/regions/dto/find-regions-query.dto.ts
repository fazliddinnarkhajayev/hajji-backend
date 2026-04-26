import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class FindRegionsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  country_id?: string;
}