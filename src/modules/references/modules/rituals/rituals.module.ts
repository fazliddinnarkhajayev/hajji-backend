import { Module } from '@nestjs/common';
import { RitualsService } from './rituals.service';
import { RitualsController } from './rituals.controller';
import { RitualsDao } from './rituals.dao';
import { RitualTranslationsDao } from './ritual-translations.dao';

@Module({
  providers: [RitualsService, RitualsDao, RitualTranslationsDao],
  controllers: [RitualsController],
  exports: [RitualsService, RitualsDao, RitualTranslationsDao],
})
export class RitualsModule {}
