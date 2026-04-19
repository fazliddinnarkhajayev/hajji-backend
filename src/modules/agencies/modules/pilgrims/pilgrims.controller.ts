import { Controller, Get, Param, Query } from '@nestjs/common';
import { AgencyPilgrimsService } from './pilgrims.service';
import { JwtAuthGuard, JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@Controller('agencies/pilgrims')
export class AgencyPilgrimsController {
  constructor(private readonly pilgrimsService: AgencyPilgrimsService) {}

  @Get()
  async getAgencyPilgrims(
    @CurrentUser() user: JwtPayload,
    @Query() query: any,
  ) {
    return this.pilgrimsService.getAgencyPilgrims(user, query);
  }

  @Get(':userId')
  async getPilgrimDetails(@Param('userId') userId: string) {
    return this.pilgrimsService.getPilgrimDetails(userId);
  }
}
