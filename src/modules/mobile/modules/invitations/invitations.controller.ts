import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { UpdateInvitationStatusDto } from './invitations.dto';
import { CurrentUser } from 'src/shared/decorators';

@Controller('mobile/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  async getInvitations(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    return this.invitationsService.getAll(user, query);
  }

  @Get(':id')
  async getInvitation(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.getInvitationDetail(id, user);
  }

  @Put(':id')
  async respondToInvitation(
    @Param('id') id: string,
    @Body() body: UpdateInvitationStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.invitationsService.respondToInvitation(
      id,
      user,
      body,
    );
  }
}
