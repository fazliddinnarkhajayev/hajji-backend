import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/shared/decorators';
import { AgencyRolesGuard } from 'src/shared/guards/agency-roles.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(AgencyRolesGuard)
@Controller('agencies/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** ?tz= IANA zone the days are counted in (default Asia/Tashkent). Every agency role sees the whole agency. */
  @Get()
  async get(@CurrentUser() user: any, @Query('tz') tz?: string) {
    return this.dashboardService.get(user, tz);
  }
}
