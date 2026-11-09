import { Module } from '@nestjs/common';
import { RitualSessionsDao } from 'src/shared/dao/ritual-sessions.dao';
import { MobileRitualSessionsController } from './ritual-sessions.controller';
import { MobileRitualSessionsService } from './ritual-sessions.service';

@Module({
  controllers: [MobileRitualSessionsController],
  providers: [MobileRitualSessionsService, RitualSessionsDao],
})
export class MobileRitualSessionsModule {}
