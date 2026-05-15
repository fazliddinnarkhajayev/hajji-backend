import { Module } from '@nestjs/common';
import { DuasService } from './duas.service';
import { DuasController } from './duas.controller';
import { DuasDao } from './duas.dao';

@Module({
  providers: [DuasService, DuasDao],
  controllers: [DuasController],
})
export class DuasModule {}
