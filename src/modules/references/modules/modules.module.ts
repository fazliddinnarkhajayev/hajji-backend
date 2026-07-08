import { Module } from '@nestjs/common';
import { CountriesModule } from './countries/countries.module';
import { DistrictsModule } from './districts/districts.module';
import { RegionsModule } from './regions/regions.module';
import { LocationsModule } from './locations/locations.module';
import { DuasModule } from './duas/duas.module';
import { RitualsModule } from './rituals/rituals.module';

@Module({
  imports: [CountriesModule, DistrictsModule, RegionsModule, LocationsModule, DuasModule, RitualsModule],
})
export class ReferencesModulesModule {}
