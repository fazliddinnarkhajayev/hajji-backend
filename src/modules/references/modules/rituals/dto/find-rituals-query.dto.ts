import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

export class FindRitualsQueryDto extends PaginationDto {
  @IsOptional()
  @IsIn(['umrah', 'hajj'])
  type?: string;
}
