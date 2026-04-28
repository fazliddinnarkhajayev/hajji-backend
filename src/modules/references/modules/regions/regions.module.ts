import { Module } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { RegionsController } from './regions.controller';
import { RegionsDao } from './regions.dao';

@Module({
  providers: [RegionsService, RegionsDao],
  controllers: [RegionsController],
  exports: [RegionsService],
})
export class RegionsModule {}
