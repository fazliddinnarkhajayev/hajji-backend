import { Module } from '@nestjs/common';
import { AdminDashboardController } from './dashboard.controller';
import { AdminDashboardDao } from './dashboard.dao';
import { AdminDashboardService } from './dashboard.service';

@Module({
  providers: [AdminDashboardService, AdminDashboardDao],
  controllers: [AdminDashboardController],
})
export class AdminDashboardModule {}
