import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { CountriesDao } from './countries.dao';
import { RegionsModule } from '../regions/regions.module';

@Module({
  imports: [RegionsModule],
  providers: [CountriesService, CountriesDao],
  controllers: [CountriesController],
})
export class CountriesModule {}
