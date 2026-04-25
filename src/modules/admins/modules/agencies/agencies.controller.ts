import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

@Controller('admins/agencies')
export class AgenciesController {
  constructor(private readonly agenciesService: AgenciesService) {}

  @Post()
  async create(@Body() createAgencyDto: CreateAgencyDto) {
    return this.agenciesService.create(createAgencyDto);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.agenciesService.findAllPaginated({}, pagination.page_index, pagination.page_size);
  }

  @Get('reference/list')
  async findAllReference() {
    return this.agenciesService.findAllReference();
  }

  @Get('requests')
  async findRequests(@Query() pagination: PaginationDto) {
    return this.agenciesService.findRequests(pagination.page_index, pagination.page_size);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.agenciesService.findOne(id);
  }

  @Get(':id/guides')
  async findGuidesByAgency(@Param('id') id: string, @Query('has_group') hasGroup?: string) {
    const hasGroupBool = hasGroup !== undefined ? hasGroup === 'true' : undefined;
    return this.agenciesService.findGuidesByAgency(id, hasGroupBool);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAgencyDto: UpdateAgencyDto) {
    return this.agenciesService.update(id, updateAgencyDto);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.agenciesService.approve(id);
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    return this.agenciesService.reject(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.agenciesService.remove(id);
  }
}
