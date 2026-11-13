import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AgencyRoles, CurrentUser } from 'src/shared/decorators';
import { AgencyRolesGuard } from 'src/shared/guards/agency-roles.guard';
import { AgencyUserRoleEnum } from 'src/shared/enums/agency-user-role.enum';
import { AgencyBillingService } from './billing.service';
import { ActivationsQueryDto, AgencyRefundRequestsQueryDto, AgencyTransactionsQueryDto, CreateRefundRequestDto } from './billing.dto';

const MANAGE_ROLES = [AgencyUserRoleEnum.SUPERADMIN, AgencyUserRoleEnum.SUPERVISOR];

@UseGuards(AgencyRolesGuard)
@Controller('agencies/billing')
export class AgencyBillingController {
  constructor(private readonly service: AgencyBillingService) {}

  /** Balance and coin price; every agency user sees it (the header shows the balance). */
  @Get('wallet')
  wallet(@CurrentUser() user: any) {
    return this.service.wallet(user.agency_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Get('transactions')
  transactions(@CurrentUser() user: any, @Query() q: AgencyTransactionsQueryDto) {
    return this.service.transactions(user.agency_id, q.page_index, q.page_size, q.type);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Get('activations')
  activations(@CurrentUser() user: any, @Query() q: ActivationsQueryDto) {
    return this.service.activations(user.agency_id, q);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Get('refund-requests')
  refundRequests(@CurrentUser() user: any, @Query() q: AgencyRefundRequestsQueryDto) {
    return this.service.refundRequests(user.agency_id, q);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Post('refund-requests')
  createRefundRequest(@CurrentUser() user: any, @Body() dto: CreateRefundRequestDto) {
    return this.service.createRefundRequest(user.agency_id, dto, user.user_id ?? user.id);
  }
}
