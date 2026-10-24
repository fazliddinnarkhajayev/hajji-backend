import { Controller, Get, Post, Param, Query, Patch, Body, Put, Delete, UseGuards, Res } from '@nestjs/common';
import type { Response } from 'express';
import { GroupsService } from './groups.service';
import { AgencyRoles, CurrentUser } from 'src/shared/decorators';
import { AgencyRolesGuard } from 'src/shared/guards/agency-roles.guard';
import { AgencyUserRoleEnum } from 'src/shared/enums/agency-user-role.enum';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddPilgrimToGroupDto } from './dto/add-pilgrim-to-group.dto';
import { CreateRoomRequestDto } from './dto/create-room-request.dto';
import { UpdateRoomRequestDto } from './dto/update-room-request.dto';
import { AddRoomRequestMemberDto } from './dto/add-room-request-member.dto';
import { CreateRoomsDto } from './dto/create-rooms.dto';
import { AddRoomMemberDto } from './dto/add-room-member.dto';
import { BulkUpdateMemberDocumentsDto, UpdateMemberDocumentsDto } from './dto/update-member-documents.dto';
import { GroupStatus } from 'src/shared/dao/group-status';

/** Only agency admins (not field managers) may change groups, rooms and plans. */
const MANAGE_ROLES = [AgencyUserRoleEnum.SUPERADMIN, AgencyUserRoleEnum.SUPERVISOR];

@UseGuards(AgencyRolesGuard)
@Controller('agencies/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @AgencyRoles(...MANAGE_ROLES)
  @Post()
  async create(@Body() createGroupDto: CreateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.create(user.agency_id, createGroupDto);
  }

  /** ?status= effective status (FORMING | FORMED | IN_TRIP | TRIP_ENDED | CANCELLED), ?q= part of the name. */
  @Get()
  async getAll(@CurrentUser() user: any, @Query() query: any) {
    const { page = '1', limit = '10', status, q } = query;
    return this.groupsService.findByAgency(user.agency_id, parseInt(page, 10), parseInt(limit, 10), {
      status: status ? (String(status) as GroupStatus) : undefined,
      q: q ? String(q) : undefined,
    });
  }

  /** Counts per effective status for the status cards. Declared before ':id'. */
  @Get('stats')
  async getStats(@CurrentUser() user: any) {
    return this.groupsService.getStats(user.agency_id);
  }

  // ── Multi-segment routes before :id ───────────────────────

  /** New "Router orqali" voice key for the group (returns key_version only, never the key). */
  @AgencyRoles(...MANAGE_ROLES)
  @Post(':groupId/voice-key/rotate')
  async rotateVoiceKey(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.rotateVoiceKey(groupId, user.agency_id);
  }

  @Get(':groupId/members')
  async getPilgrimsInGroup(
    @Param('groupId') groupId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @CurrentUser() user: any,
  ) {
    return this.groupsService.getPilgrimsInGroup(
      groupId,
      user.agency_id,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Post(':groupId/members')
  async addPilgrimToGroup(
    @Param('groupId') groupId: string,
    @Body() dto: AddPilgrimToGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addPilgrimToGroup(groupId, user.agency_id, dto.pilgrim_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Delete(':groupId/members/:pilgrimId')
  async removePilgrimFromGroup(
    @Param('groupId') groupId: string,
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removePilgrimFromGroup(groupId, user.agency_id, pilgrimId);
  }

  // ── Visa / ticket ─────────────────────────────────────────

  @AgencyRoles(...MANAGE_ROLES)
  @Patch(':groupId/members/documents')
  async bulkUpdateMemberDocuments(
    @Param('groupId') groupId: string,
    @Body() dto: BulkUpdateMemberDocumentsDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.bulkUpdateMemberDocuments(groupId, user.agency_id, dto, user.user_id ?? user.id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Patch(':groupId/members/:pilgrimId/documents')
  async updateMemberDocuments(
    @Param('groupId') groupId: string,
    @Param('pilgrimId') pilgrimId: string,
    @Body() dto: UpdateMemberDocumentsDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.updateMemberDocuments(groupId, user.agency_id, pilgrimId, dto, user.user_id ?? user.id);
  }

  /** Excel list for the visa office / airline: ?type=visa | ticket. */
  @Get(':groupId/export')
  async exportDocuments(
    @Param('groupId') groupId: string,
    @Query('type') type: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.groupsService.exportDocuments(groupId, user.agency_id, type as any);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${type === 'visa' ? 'viza' : 'aviabilet'}.xlsx"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    res.send(buffer);
  }

  @Get(':groupId/room-requests')
  async getRoomRequests(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.getRoomRequests(groupId, user.agency_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Post(':groupId/room-requests')
  async createRoomRequest(
    @Param('groupId') groupId: string,
    @Body() dto: CreateRoomRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.createRoomRequest(groupId, user.agency_id, dto.name, user.id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Patch(':groupId/room-requests/:roomRequestId')
  async updateRoomRequest(
    @Param('groupId') groupId: string,
    @Param('roomRequestId') roomRequestId: string,
    @Body() dto: UpdateRoomRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.updateRoomRequest(groupId, roomRequestId, user.agency_id, dto.name);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Delete(':groupId/room-requests/:roomRequestId')
  async deleteRoomRequest(
    @Param('groupId') groupId: string,
    @Param('roomRequestId') roomRequestId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.deleteRoomRequest(groupId, roomRequestId, user.agency_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Post(':groupId/room-requests/:roomRequestId/members')
  async addRoomRequestMember(
    @Param('groupId') groupId: string,
    @Param('roomRequestId') roomRequestId: string,
    @Body() dto: AddRoomRequestMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addRoomRequestMember(groupId, roomRequestId, user.agency_id, dto.pilgrim_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Delete(':groupId/room-requests/:roomRequestId/members/:pilgrimId')
  async removeRoomRequestMember(
    @Param('groupId') groupId: string,
    @Param('roomRequestId') roomRequestId: string,
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removeRoomRequestMember(groupId, roomRequestId, user.agency_id, pilgrimId);
  }

  // ── Rooms ─────────────────────────────────────────────────

  @Get(':groupId/rooms')
  async getRooms(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.getRooms(groupId, user.agency_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Post(':groupId/rooms')
  async createRooms(
    @Param('groupId') groupId: string,
    @Body() dto: CreateRoomsDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.createRooms(groupId, user.agency_id, dto.rooms, user.id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Delete(':groupId/rooms/:roomId')
  async deleteRoom(
    @Param('groupId') groupId: string,
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.deleteRoom(groupId, roomId, user.agency_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Post(':groupId/rooms/:roomId/members')
  async addRoomMember(
    @Param('groupId') groupId: string,
    @Param('roomId') roomId: string,
    @Body() dto: AddRoomMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addRoomMember(groupId, roomId, user.agency_id, dto.pilgrim_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Delete(':groupId/rooms/:roomId/members/:pilgrimId')
  async removeRoomMember(
    @Param('groupId') groupId: string,
    @Param('roomId') roomId: string,
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removeRoomMember(groupId, roomId, user.agency_id, pilgrimId);
  }

  // ── Single-param routes ────────────────────────────────────

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.findOne(id, user.agency_id);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.update(id, user.agency_id, updateGroupDto);
  }

  @AgencyRoles(...MANAGE_ROLES)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.remove(id, user.agency_id);
  }
}
