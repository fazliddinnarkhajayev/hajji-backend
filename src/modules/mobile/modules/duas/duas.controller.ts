import { Controller, Get, Param } from '@nestjs/common';
import { MobileDuasService } from './duas.service';
import { IsPublic } from 'src/shared/decorators';

/**
 * Read-only dua content for the hajji-guide mobile app. Public — content is
 * not user-specific. Returns every dua with ALL its translations so the app
 * can download once and switch language offline without re-downloading.
 */
@Controller('mobile/duas')
export class MobileDuasController {
  constructor(private readonly duasService: MobileDuasService) {}

  @IsPublic()
  @Get()
  findAll() {
    return this.duasService.findAll();
  }

  @IsPublic()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.duasService.findOne(id);
  }
}
