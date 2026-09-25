import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsDao } from './locations.dao';
import { LocationTranslationsDao } from './location-translations.dao';

@Module({
  providers: [LocationsService, LocationsDao, LocationTranslationsDao],
  controllers: [LocationsController],
  exports: [LocationsService, LocationsDao, LocationTranslationsDao],
})
export class LocationsModule {}
