import { Controller, Get, Param } from '@nestjs/common';
import { MobileLocationsService } from './locations.service';
import { IsPublic } from 'src/shared/decorators';

/**
 * Read-only location content for the hajji-guide mobile app. Public — content
 * is not user-specific. Returns every location with ALL its translations so
 * the app can download once and switch language offline.
 */
@Controller('mobile/locations')
export class MobileLocationsController {
  constructor(private readonly locationsService: MobileLocationsService) {}

  @IsPublic()
  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @IsPublic()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.locationsService.findOne(id);
  }
}
