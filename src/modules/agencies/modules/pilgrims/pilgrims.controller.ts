import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AgencyPilgrimsService } from './pilgrims.service';
import { JwtAuthGuard, JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('agencies/pilgrims')
export class AgencyPilgrimsController {
  constructor(private readonly pilgrimsService: AgencyPilgrimsService) {}

  @Get()
  async getAgencyPilgrims(
    @CurrentUser() user: JwtPayload,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    return this.pilgrimsService.getAgencyPilgrims(user, pageIndex, pageSize);
  }

  @Get(':userId')
  async getPilgrimDetails(@Param('userId') userId: string) {
    return this.pilgrimsService.getPilgrimDetails(userId);
  }
}
