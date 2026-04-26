import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { IsPublic } from 'src/shared/decorators';
import { FindRegionsQueryDto } from './dto/find-regions-query.dto';

@Controller('references/regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) { }

  @Post()
  async create(@Body() createRegionDto: CreateRegionDto) {
    return this.regionsService.create(createRegionDto);
  }

  @IsPublic()
  @Get()
  async findAll(@Query() query: FindRegionsQueryDto) {
    const filters = query.country_id ? { country_id: query.country_id } : {};

    return this.regionsService.findAllPaginated(filters, query.page_index, query.page_size);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.regionsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRegionDto: UpdateRegionDto) {
    return this.regionsService.update(id, updateRegionDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.regionsService.remove(id);
  }
}
