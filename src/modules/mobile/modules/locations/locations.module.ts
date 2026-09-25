import { Module } from '@nestjs/common';
import { MobileLocationsController } from './locations.controller';
import { MobileLocationsService } from './locations.service';
import { LocationsModule } from 'src/modules/references/modules/locations/locations.module';

@Module({
  imports: [LocationsModule],
  controllers: [MobileLocationsController],
  providers: [MobileLocationsService],
})
export class MobileLocationsModule {}
