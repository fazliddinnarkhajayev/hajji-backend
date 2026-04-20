import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './invitations.dto';
import { CurrentUser } from 'src/shared/decorators';

@Controller('agencies/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async create(
    @Body() body: CreateInvitationDto,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.create(user.agency_id, body, user);
  }

  @Get()
  async getAll(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.invitationsService.getAll(user.agency_id, query);
  }
}
