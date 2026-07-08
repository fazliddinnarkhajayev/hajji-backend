import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

@Controller('references/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  async create(@Body() createLocationDto: CreateLocationDto) {
    return this.locationsService.createWithTranslations(createLocationDto);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.locationsService.findAllPaginatedWithTranslations(
      pagination.page_index ?? 1,
      pagination.page_size ?? 10,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.locationsService.findOneWithTranslations(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.updateWithTranslations(id, updateLocationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
