import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class ListRitualSessionsDto extends PaginationDto {
  @IsOptional()
  @IsIn(['TAWAF', 'SAI'])
  type?: 'TAWAF' | 'SAI';
}
