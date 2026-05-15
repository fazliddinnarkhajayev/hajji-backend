import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { DuasService } from './duas.service';
import { CreateDuaDto } from './dto/create-dua.dto';
import { UpdateDuaDto } from './dto/update-dua.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { IsPublic } from 'src/shared/decorators/is-public.decorator';

@Controller('references/duas')
export class DuasController {
  constructor(private readonly duasService: DuasService) {}

  @Post()
  async create(@Body() dto: CreateDuaDto) {
    return this.duasService.create(dto);
  }

  @IsPublic()
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.duasService.findAllPaginated({}, pagination.page_index, pagination.page_size);
  }

  @IsPublic()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.duasService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDuaDto) {
    return this.duasService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.duasService.remove(id);
  }
}
