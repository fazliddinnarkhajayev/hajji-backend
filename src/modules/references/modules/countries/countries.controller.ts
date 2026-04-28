import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { IsPublic } from 'src/shared/decorators/is-public.decorator';
import { RegionsService } from '../regions/regions.service';

@Controller('references/countries')
export class CountriesController {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly regionsService: RegionsService,
  ) { }

  @Post()
  async create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  @IsPublic()
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.countriesService.findAllPaginated({}, pagination.page_index, pagination.page_size);
  }

  @IsPublic()
  @Get(':id/regions')
  async findRegions(@Param('id') id: string, @Query() pagination: PaginationDto) {
    return this.regionsService.findAllPaginated(
      { country_id: id } as any,
      pagination.page_index,
      pagination.page_size,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.countriesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.countriesService.remove(id);
  }
}
