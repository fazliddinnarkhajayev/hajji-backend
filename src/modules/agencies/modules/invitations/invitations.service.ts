import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InvitationsDao, Invitation } from 'src/shared/dao/invitations.dao';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { PilgrimAgencyHistoryDao } from 'src/shared/dao/pilgrim-agency-history.dao';
import { CreateInvitationDto, UpdateInvitationStatusDto } from './invitations.dto';
import { InvitationStatus } from './enums/invitation-status.enum';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsDao: InvitationsDao,
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly historyDao: PilgrimAgencyHistoryDao,
  ) {}

  async createInvitation(
    agencyId: string,
    body: CreateInvitationDto,
    user: any,
  ): Promise<Invitation> {
    const { pilgrim_id, message } = body;

    // Check if pilgrim exists
    const pilgrim = await this.pilgrimsDao.findById(pilgrim_id);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }

    // Check if pilgrim already has an agency
    if (pilgrim.agency_id) {
      throw new BadRequestException('This pilgrim already has an agency assigned');
    }

    // Check if invitation already exists
    const existingInvitation = await this.invitationsDao.getInvitationByPilgrimAndAgency(
      pilgrim_id,
      agencyId,
      InvitationStatus.PENDING,
    );
    if (existingInvitation) {
      throw new BadRequestException('An invitation has already been sent to this pilgrim for your agency');
    }

    // Create invitation
    const invitation = await this.invitationsDao.createInvitation({
      pilgrim_id,
      agency_id: agencyId,
      invited_by: user.id,
      status: InvitationStatus.PENDING,
      message: message || null,
    });

    return invitation;
  }

  async acceptInvitation(
    invitationId: string,
    user: any,
  ): Promise<Invitation> {
    // Get invitation with joins
    const invitation = await this.invitationsDao.getInvitationWithJoins(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`This invitation has already been ${invitation.status.toLowerCase()}`);
    }

    // Check if it's expired
    if (invitation.expires_at && new Date() > invitation.expires_at) {
      throw new BadRequestException('This invitation has expired');
    }

    // Check if pilgrim belongs to the current user
    const pilgrim = await this.pilgrimsDao.findById(invitation.pilgrim_id);
    if (pilgrim?.user_id !== user.id) {
      throw new BadRequestException('You can only accept invitations for yourself');
    }

    // Update invitation status
    const updated = await this.invitationsDao.updateInvitationStatus(
      invitationId,
      InvitationStatus.ACCEPTED,
    );

    // Set agency for pilgrim
    await this.pilgrimsDao.updateById(invitation.pilgrim_id, {
      agency_id: invitation.agency_id,
      updated_at: new Date(),
    } as any);

    // Create history record
    await this.historyDao.createHistory({
      pilgrim_id: invitation.pilgrim_id,
      agency_id: invitation.agency_id,
      user_id: user.id,
      action: 'SET',
      notes: 'Accepted invitation from agency',
    });

    return updated!;
  }

  async rejectInvitation(
    invitationId: string,
    user: any,
  ): Promise<Invitation> {
    // Get invitation
    const invitation = await this.invitationsDao.getInvitationWithJoins(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(`This invitation has already been ${invitation.status.toLowerCase()}`);
    }

    // Check if pilgrim belongs to the current user
    const pilgrim = await this.pilgrimsDao.findById(invitation.pilgrim_id);
    if (pilgrim?.user_id !== user.id) {
      throw new BadRequestException('You can only reject invitations for yourself');
    }

    // Update invitation status
    const updated = await this.invitationsDao.updateInvitationStatus(
      invitationId,
      InvitationStatus.REJECTED,
    );

    return updated!;
  }

  async getPilgrimInvitations(
    user: any,
    query: any,
  ) {
    const { page = '1', limit = '10' } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const offset = (pageIndex - 1) * pageSize;

    // Get pilgrim by user_id
    const pilgrim = await this.pilgrimsDao.findByUserId(user.id);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim profile not found');
    }

    // Get pending invitations
    const invitations = await this.invitationsDao.getPendingInvitationsForPilgrim(
      pilgrim.id,
      pageSize,
      offset,
    );

    const total = await this.invitationsDao.countPendingInvitations(pilgrim.id);
    const totalPages = Math.ceil(total / pageSize);

    return {
      data: invitations,
      meta: {
        total_items_count: total,
        total_pages_count: totalPages,
        page_size: pageSize,
        page_index: pageIndex,
      },
    };
  }

  async getAgencyInvitations(
    agencyId: string,
    query: any,
  ) {
    const { page = '1', limit = '10' } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const offset = (pageIndex - 1) * pageSize;

    // Get invitations sent by agency
    const invitations = await this.invitationsDao.getPendingInvitationsForAgency(
      agencyId,
      pageSize,
      offset,
    );

    return {
      data: invitations,
      meta: {
        page_size: pageSize,
        page_index: pageIndex,
      },
    };
  }
}
