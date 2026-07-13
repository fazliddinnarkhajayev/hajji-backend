import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PilgrimsService } from './pilgrims.service';
import { CreatePilgrimDto } from './dto/create-pilgrim.dto';
import { UpdatePilgrimDto } from './dto/update-pilgrim.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { CurrentUser } from 'src/shared/decorators';

@Controller('admins/pilgrims')
export class PilgrimsController {
  constructor(private readonly pilgrimsService: PilgrimsService) {}

  @Post()
  async create(@Body() dto: CreatePilgrimDto, @CurrentUser() user: any) {
    return this.pilgrimsService.create(dto, user);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.pilgrimsService.findAllPaginated({}, pagination.page_index, pagination.page_size);
  }

  // NOTE: must be declared before `@Get(':id')`, otherwise `:id` captures
  // "delete-requests".
  @Get('delete-requests')
  async listDeleteRequests(@Query() pagination: PaginationDto) {
    return this.pilgrimsService.listDeleteRequests(pagination.page_index, pagination.page_size);
  }

  @Post('delete-requests/:id/approve')
  async approveDeleteRequest(@Param('id') id: string, @CurrentUser() user: any) {
    return this.pilgrimsService.approveDeleteRequest(id, user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.pilgrimsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePilgrimDto) {
    return this.pilgrimsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.pilgrimsService.remove(id);
    return { success: data };
  }

  @Post(':id/block')
  async block(@Param('id') id: string) {
    return this.pilgrimsService.block(id);
  }

  @Post(':id/unblock')
  async unblock(@Param('id') id: string) {
    return this.pilgrimsService.unblock(id);
  }

  @Post(':id/set-agency')
  async setAgency(
    @Param('id') id: string,
    @Body() body: { agency_id: string; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.setAgency(id, body, user);
  }

  @Post(':id/remove-agency')
  async removeAgency(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.removeAgency(id, body, user);
  }

  @Get(':id/agency-history')
  async getAgencyHistory(
    @Param('id') id: string,
    @Query('limit') limit: number = 50,
    @Query('offset') offset: number = 0,
  ) {
    return this.pilgrimsService.getAgencyHistory(id, limit, offset);
  }
}
