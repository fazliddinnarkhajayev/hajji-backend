import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { IsPublic } from 'src/shared/decorators/is-public.decorator';
import { FindDistrictsQueryDto } from './dto/find-districts-query.dto';

@Controller('references/districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) { }

  @Post()
  async create(@Body() createDistrictDto: CreateDistrictDto) {
    return this.districtsService.create(createDistrictDto);
  }

  @IsPublic()
  @Get()
  async findAll(@Query() query: FindDistrictsQueryDto) {
    const filters = query.region_id ? { region_id: query.region_id } : {};

    return this.districtsService.findAllPaginated(filters, query.page_index, query.page_size);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.districtsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDistrictDto: UpdateDistrictDto) {
    return this.districtsService.update(id, updateDistrictDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.districtsService.remove(id);
  }
}
