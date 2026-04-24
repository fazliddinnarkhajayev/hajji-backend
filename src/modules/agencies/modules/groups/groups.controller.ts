import { Controller, Get, Param, Query, Patch, Body, Put } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CurrentUser } from 'src/shared/decorators';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller('agencies/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getAll(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    const { page = '1', limit = '10' } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    return this.groupsService.findByAgency(user.agency_id, pageIndex, pageSize);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.findOne(id, user.agency_id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.update(id, user.agency_id, updateGroupDto);
  }
}
