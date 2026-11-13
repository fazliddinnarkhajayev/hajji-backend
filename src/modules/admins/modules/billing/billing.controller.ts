import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminOnlyGuard } from 'src/shared/guards/admin-only.guard';
import { CurrentUser } from 'src/shared/decorators';
import { AdminBillingService } from './billing.service';
import {
  AdjustDto, CreateCurrencyDto, DecideRefundDto, RefundRequestsQueryDto, SetAgencyCurrencyDto, TopupDto, TransactionsQueryDto, UpdateCurrencyDto,
} from './dto/billing.dto';

const uid = (user: any): string | undefined => user?.user_id ?? user?.id;

@Controller('admins/billing')
@UseGuards(AdminOnlyGuard)
export class AdminBillingController {
  constructor(private readonly service: AdminBillingService) {}

  @Get('currencies')
  currencies() {
    return this.service.currencies();
  }

  @Post('currencies')
  createCurrency(@Body() dto: CreateCurrencyDto, @CurrentUser() user: any) {
    return this.service.createCurrency(dto, uid(user));
  }

  @Patch('currencies/:code')
  updateCurrency(@Param('code') code: string, @Body() dto: UpdateCurrencyDto, @CurrentUser() user: any) {
    return this.service.updateCurrency(code, dto, uid(user));
  }

  @Get('agencies')
  agencies() {
    return this.service.agencies();
  }

  @Get('agencies/:id/wallet')
  wallet(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.wallet(id);
  }

  @Get('agencies/:id/transactions')
  transactions(@Param('id', ParseUUIDPipe) id: string, @Query() q: TransactionsQueryDto) {
    return this.service.transactions(id, q.page_index, q.page_size, q.type);
  }

  @Patch('agencies/:id/currency')
  setCurrency(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetAgencyCurrencyDto) {
    return this.service.setCurrency(id, dto.currency_code);
  }

  @Post('agencies/:id/topup')
  topup(@Param('id', ParseUUIDPipe) id: string, @Body() dto: TopupDto, @CurrentUser() user: any) {
    return this.service.topup(id, dto, uid(user));
  }

  @Post('agencies/:id/adjust')
  adjust(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AdjustDto, @CurrentUser() user: any) {
    return this.service.adjust(id, dto, uid(user));
  }

  @Get('refund-requests')
  refundRequests(@Query() q: RefundRequestsQueryDto) {
    return this.service.refundRequests(q);
  }

  @Get('refund-requests/pending-count')
  pendingCount() {
    return this.service.pendingCount();
  }

  @Post('refund-requests/:id/approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideRefundDto, @CurrentUser() user: any) {
    return this.service.approve(id, dto, uid(user));
  }

  @Post('refund-requests/:id/reject')
  reject(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DecideRefundDto, @CurrentUser() user: any) {
    return this.service.reject(id, dto, uid(user));
  }
}
