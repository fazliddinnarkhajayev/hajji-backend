import { Module } from '@nestjs/common';
import { RitualSessionsDao } from 'src/shared/dao/ritual-sessions.dao';
import { AdminRitualSessionsController } from './ritual-sessions.controller';
import { AdminRitualSessionsService } from './ritual-sessions.service';

@Module({
  controllers: [AdminRitualSessionsController],
  providers: [AdminRitualSessionsService, RitualSessionsDao],
})
export class AdminRitualSessionsModule {}
