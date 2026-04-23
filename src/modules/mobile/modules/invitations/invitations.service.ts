import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InvitationsDao, Invitation } from 'src/shared/dao/invitations.dao';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { PilgrimAgencyHistoryDao } from 'src/shared/dao/pilgrim-agency-history.dao';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { UpdateInvitationStatusDto } from './invitations.dto';
import { InvitationStatus } from 'src/modules/agencies/modules/invitations/enums/invitation-status.enum';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsDao: InvitationsDao,
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly pilgrimAgencyHistoryDao: PilgrimAgencyHistoryDao,
    private readonly webSocketService: WebSocketService,
  ) {}

  async getAll(
    user: any,
    query: any,
  ): Promise<PaginatedResult<Invitation>> {
    const { page = "1", limit = "10" } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    // Get invitations sent by agency using base DAO with filter
    return this.invitationsDao.findManyPaginated(
      {
        pilgrim_id: user.pilgrim?.id,
      } as any,
      pageIndex,
      pageSize,
    );
  }

  async getInvitationDetail(
    invitationId: string,
    user: any,
  ): Promise<Invitation> {
    const { pilgrim_id } = user;
    const invitation = await this.invitationsDao.findById(invitationId);

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the invitation belongs to this pilgrim
    if (invitation.pilgrim_id !== pilgrim_id) {
      throw new BadRequestException(
        'This invitation does not belong to you',
      );
    }

    return invitation;
  }

  async respondToInvitation(
    invitationId: string,
    user: any,
    body: UpdateInvitationStatusDto,
  ): Promise<Invitation> {
    const { status } = body;
    const pilgrim_id = user.pilgrim?.id;

    // Get invitation (before transaction - for validation)
    const invitation = await this.invitationsDao.findById(invitationId);
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Verify the invitation belongs to this pilgrim
    if (invitation.pilgrim_id !== pilgrim_id) {
      throw new BadRequestException(
        'This invitation does not belong to you',
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException(
        'You can only respond to pending invitations',
      );
    }

    // Check if pilgrim already has an agency (only for acceptance)
    if (status === InvitationStatus.ACCEPTED) {
      const pilgrim = await this.pilgrimsDao.findById(pilgrim_id);
      if (pilgrim?.agency_id) {
        throw new BadRequestException(
          'You already have an agency assigned',
        );
      }
    }

    // Execute all updates in a transaction
    const updated = await this.invitationsDao.transaction(async (trx) => {
      // Update invitation status
      const invitationUpdated = await this.invitationsDao.updateById(
        invitationId,
        {
          status,
          updated_at: new Date(),
        } as any,
        trx,
      );

      // If accepted, update pilgrim's agency_id and create history record
      if (status === InvitationStatus.ACCEPTED) {
        await this.pilgrimsDao.updateById(
          pilgrim_id,
          {
            agency_id: invitation.agency_id,
            updated_at: new Date(),
          } as any,
          trx,
        );

        // Create history record
        await this.pilgrimAgencyHistoryDao.insert(
          {
            pilgrim_id,
            agency_id: invitation.agency_id,
            user_id: user.id,
            action: 'assigned',
            notes: `Pilgrim accepted invitation from agency`,
          } as any,
          trx,
        );
      }

      return invitationUpdated;
    });

    // Send notification to agency about the response (outside transaction)
    const updatedWithDetails = await this.invitationsDao.findById(invitationId);
    this.webSocketService.broadcastToUser(
      invitation.created_by_id,
      'invitation_response',
      {
        type: 'INVITATION_RESPONSE',
        invitation: updatedWithDetails,
        status,
        message: `Pilgrim ${updatedWithDetails?.pilgrim?.first_name || ''} ${updatedWithDetails?.pilgrim?.last_name || ''} has ${status.toLowerCase()} your invitation`,
      },
    );

    return updated;
  }
}
