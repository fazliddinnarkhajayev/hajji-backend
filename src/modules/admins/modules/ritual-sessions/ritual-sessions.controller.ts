import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { AdminOnlyGuard } from 'src/shared/guards/admin-only.guard';
import { ListRitualSessionsDto } from './dto/list-ritual-sessions.dto';
import { AdminRitualSessionsService } from './ritual-sessions.service';

/** Tawaf / Sa'y runs uploaded by the Hajji Guide app. */
@Controller('admins/ritual-sessions')
@UseGuards(AdminOnlyGuard)
export class AdminRitualSessionsController {
  constructor(private readonly service: AdminRitualSessionsService) {}

  @Get()
  findAll(@Query() query: ListRitualSessionsDto) {
    return this.service.findAllPaginated(query.type, query.page_index, query.page_size);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }
}
