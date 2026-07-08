import { Module } from '@nestjs/common';
import { DuasService } from './duas.service';
import { DuasController } from './duas.controller';
import { DuasDao } from './duas.dao';
import { DuaTranslationsDao } from './dua-translations.dao';

@Module({
  providers: [DuasService, DuasDao, DuaTranslationsDao],
  controllers: [DuasController],
  exports: [DuasService, DuasDao, DuaTranslationsDao],
})
export class DuasModule {}
