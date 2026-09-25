import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { MobilePlansService } from './plans.service';
import { CurrentUser } from 'src/shared/decorators';
import { MobileConfirmProcedureDto } from './dto/confirm-procedure.dto';

@Controller('mobile/plans')
export class MobilePlansController {
  constructor(private readonly service: MobilePlansService) {}

  @Get('current')
  getCurrent(
    @CurrentUser() user: any,
    @Query('local_date') localDate?: string,
  ) {
    return this.service.getCurrentPlan(user.user_id, localDate);
  }

  /** Whole plan (all days) for offline storage in the app. */
  @Get('offline')
  getOffline(@CurrentUser() user: any) {
    return this.service.getOfflinePlan(user.user_id);
  }

  /** Guide: group roster, fetched once and cached by the app. */
  @Get('members')
  getRoster(@CurrentUser() user: any) {
    return this.service.getGroupRoster(user.user_id);
  }

  @Post('procedures/:procedureId/confirm')
  confirmProcedure(
    @Param('procedureId') procedureId: string,
    @Body() dto: MobileConfirmProcedureDto,
    @CurrentUser() user: any,
  ) {
    return this.service.confirmProcedure(user.user_id, procedureId, dto.comment, dto.confirmed_at);
  }

  @Get('procedures/:procedureId/members')
  getMemberStatus(
    @Param('procedureId') procedureId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getGroupMembersForGuide(user.user_id, procedureId);
  }
}
