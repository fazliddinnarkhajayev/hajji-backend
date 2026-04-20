import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InvitationsDao, Invitation } from "src/shared/dao/invitations.dao";
import { PilgrimsDao } from "src/shared/dao/piligrims.dao";
import { WebSocketService } from "src/modules/websocket/websocket.service";
import { CreateInvitationDto } from "./invitations.dto";
import { InvitationStatus } from "./enums/invitation-status.enum";
import { PaginatedResult } from "src/shared/interfaces/pagination.interface";

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsDao: InvitationsDao,
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly webSocketService: WebSocketService,
  ) {}

  async create(
    agencyId: string,
    body: CreateInvitationDto,
    user: any,
  ): Promise<Invitation> {
    const { pilgrim_id, message } = body;

    // Check if pilgrim exists
    const pilgrim = await this.pilgrimsDao.findById(pilgrim_id);
    if (!pilgrim) {
      throw new NotFoundException("Pilgrim not found");
    }

    // Check if pilgrim already has an agency
    if (pilgrim.agency_id) {
      throw new BadRequestException(
        "This pilgrim already has an agency assigned",
      );
    }

    // Check if invitation already exists
    const existingInvitation = await this.invitationsDao.findOne({
      pilgrim_id,
      agency_id: agencyId,
      status: InvitationStatus.PENDING,
    } as any);
    if (existingInvitation) {
      throw new BadRequestException(
        "An invitation has already been sent to this pilgrim for your agency",
      );
    }

    // Create invitation
    const invitation = await this.invitationsDao.insert({
      pilgrim_id,
      agency_id: agencyId,
      created_by_id: user.id,
      status: InvitationStatus.PENDING,
      message: message || null,
    } as any);

    // Send notification to pilgrim about the new invitation
    if (pilgrim.user_id) {
      this.webSocketService.broadcastToUser(
        pilgrim.user_id,
        'new_invitation',
        {
          type: 'NEW_INVITATION',
          invitation,
          message: `You have received a new invitation from ${invitation.agency?.name || 'an agency'}`,
        },
      );
    }

    return invitation;
  }

  async getAll(
    agencyId: string,
    query: any,
  ): Promise<PaginatedResult<Invitation>> {
    const { page = "1", limit = "10" } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Get invitations sent by agency using base DAO with filter
    return this.invitationsDao.findManyPaginated(
      {
        agency_id: agencyId,
      } as any,
      pageIndex,
      pageSize,
    );
  }
}
