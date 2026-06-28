import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { AgencyPilgrimsService } from './pilgrims.service';
import { JwtAuthGuard, JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { CreatePilgrimDto } from './dto/create-pilgrim.dto';

@Controller('agencies/pilgrims')
export class AgencyPilgrimsController {
  constructor(private readonly pilgrimsService: AgencyPilgrimsService) {}

  @Post()
  async create(
    @Body() dto: CreatePilgrimDto,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.create(dto, user);
  }

  @Get()
  async getAgencyPilgrims(
    @CurrentUser() user: JwtPayload,
    @Query() query: any,
  ) {
    return this.pilgrimsService.getAgencyPilgrims(user, query);
  }

  @Get('guides')
  async getGuides(
    @CurrentUser() user: JwtPayload,
    @Query() query: any,
  ) {
    return this.pilgrimsService.getGuides(user, query);
  }

  @Get('search')
  async searchPilgrims(@Query() query: any) {
    return this.pilgrimsService.searchPilgrimsByPhoneOrPinfl(query);
  }

  @Get(':userId')
  async getPilgrimDetails(@Param('userId') userId: string) {
    return this.pilgrimsService.getPilgrimDetails(userId);
  }

  @Patch(':pilgrimId/set-as-guide')
  async setAsGuide(
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.setAsGuide(pilgrimId, user.agency_id);
  }

  @Patch(':pilgrimId/remove-as-guide')
  async removeAsGuide(
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.removeAsGuide(pilgrimId, user.agency_id);
  }

}