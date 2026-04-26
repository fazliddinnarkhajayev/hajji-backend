import { IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class FindDistrictsQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  region_id?: string;
}