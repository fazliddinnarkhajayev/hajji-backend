import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardDao } from './dashboard.dao';

@Module({
  providers: [DashboardService, DashboardDao],
  controllers: [DashboardController],
})
export class DashboardModule {}
