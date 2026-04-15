import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsDao } from './locations.dao';

@Module({
  providers: [LocationsService, LocationsDao],
  controllers: [LocationsController],
})
export class LocationsModule {}
