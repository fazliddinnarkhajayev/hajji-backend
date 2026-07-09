import { Module } from '@nestjs/common';
import { RitualsService } from './rituals.service';
import { RitualsController } from './rituals.controller';
import { RitualsDao } from './rituals.dao';
import { RitualTranslationsDao } from './ritual-translations.dao';
import { RitualSubstepsDao } from './ritual-substeps.dao';
import { RitualSubstepTranslationsDao } from './ritual-substep-translations.dao';

@Module({
  providers: [
    RitualsService,
    RitualsDao,
    RitualTranslationsDao,
    RitualSubstepsDao,
    RitualSubstepTranslationsDao,
  ],
  controllers: [RitualsController],
  exports: [RitualsService, RitualsDao, RitualTranslationsDao],
})
export class RitualsModule {}
