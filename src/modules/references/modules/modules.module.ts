import { Module } from '@nestjs/common';
import { CountriesModule } from './countries/countries.module';
import { DistrictsModule } from './districts/districts.module';
import { RegionsModule } from './regions/regions.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [CountriesModule, DistrictsModule, RegionsModule, LocationsModule],
})
export class ReferencesModulesModule {}
