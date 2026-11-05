import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { AdminOnlyGuard } from 'src/shared/guards/admin-only.guard';
import { ActivitiesService } from './activities.service';

@Controller('admins/activities')
@UseGuards(AdminOnlyGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.activitiesService.findAllPaginated(pagination.page_index, pagination.page_size);
  }
}
