import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminOnlyGuard } from 'src/shared/guards/admin-only.guard';
import { AdminDashboardService } from './dashboard.service';

@Controller('admins/dashboard')
@UseGuards(AdminOnlyGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  async get() {
    return this.dashboardService.get();
  }
}
