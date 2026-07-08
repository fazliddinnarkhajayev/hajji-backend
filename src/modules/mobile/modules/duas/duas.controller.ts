import { Controller, Get, Param, Query } from '@nestjs/common';
import { MobileDuasService } from './duas.service';
import { IsPublic } from 'src/shared/decorators';

/**
 * Read-only dua content for the hajji-guide mobile app. Public — content is
 * not user-specific. `lang` selects the pilgrim's display language; Arabic
 * (`text_ar`) is always included.
 */
@Controller('mobile/duas')
export class MobileDuasController {
  constructor(private readonly duasService: MobileDuasService) {}

  @IsPublic()
  @Get()
  findAll(@Query('lang') lang?: string) {
    return this.duasService.findAll(lang);
  }

  @IsPublic()
  @Get(':id')
  findOne(@Param('id') id: string, @Query('lang') lang?: string) {
    return this.duasService.findOne(id, lang);
  }
}
