import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto, UpdateInvitationStatusDto } from './invitations.dto';
import { CurrentUser } from 'src/shared/decorators';

@Controller('agencies/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async createInvitation(
    @Body() body: CreateInvitationDto,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.createInvitation(user.agency_id, body, user);
  }

  @Post(':invitationId/accept')
  async acceptInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.acceptInvitation(invitationId, user);
  }

  @Post(':invitationId/reject')
  async rejectInvitation(
    @Param('invitationId') invitationId: string,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.rejectInvitation(invitationId, user);
  }

  @Get('my-invitations')
  async getPilgrimInvitations(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.invitationsService.getPilgrimInvitations(user, query);
  }

  @Get()
  async getAgencyInvitations(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.invitationsService.getAgencyInvitations(user.agency_id, query);
  }
}
