import { Controller, Get, Param, Query } from '@nestjs/common';
import { MobileRitualsService } from './rituals.service';
import { IsPublic } from 'src/shared/decorators';

/**
 * Read-only ritual content for the hajji-guide mobile app. Public — content is
 * not user-specific. Returns every ritual step with ALL its translations so the
 * app can download once and switch language offline. Optionally filter by
 * `?type=umrah|hajj`.
 */
@Controller('mobile/rituals')
export class MobileRitualsController {
  constructor(private readonly ritualsService: MobileRitualsService) {}

  @IsPublic()
  @Get()
  findAll(@Query('type') type?: string) {
    return this.ritualsService.findAll(type);
  }

  @IsPublic()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ritualsService.findOne(id);
  }
}
