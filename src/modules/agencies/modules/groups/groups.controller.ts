import { Controller, Get, Post, Param, Query, Patch, Body, Put, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CurrentUser } from 'src/shared/decorators';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddPilgrimToGroupDto } from './dto/add-pilgrim-to-group.dto';
import { CreateRoomRequestDto } from './dto/create-room-request.dto';
import { UpdateRoomRequestDto } from './dto/update-room-request.dto';
import { AddRoomRequestMemberDto } from './dto/add-room-request-member.dto';
import { CreateRoomsDto } from './dto/create-rooms.dto';
import { AddRoomMemberDto } from './dto/add-room-member.dto';

@Controller('agencies/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(@Body() createGroupDto: CreateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.create(user.agency_id, createGroupDto);
  }

  @Get()
  async getAll(@CurrentUser() user: any, @Query() query: any) {
    const { page = '1', limit = '10' } = query;
    return this.groupsService.findByAgency(user.agency_id, parseInt(page, 10), parseInt(limit, 10));
  }

  // ── Multi-segment routes before :id ───────────────────────

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

  @Post(':groupId/members')
  async addPilgrimToGroup(
    @Param('groupId') groupId: string,
    @Body() dto: AddPilgrimToGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addPilgrimToGroup(groupId, user.agency_id, dto.pilgrim_id);
  }

  @Delete(':groupId/members/:pilgrimId')
  async removePilgrimFromGroup(
    @Param('groupId') groupId: string,
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removePilgrimFromGroup(groupId, user.agency_id, pilgrimId);
  }

  @Get(':groupId/room-requests')
  async getRoomRequests(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.getRoomRequests(groupId, user.agency_id);
  }

  @Post(':groupId/room-requests')
  async createRoomRequest(
    @Param('groupId') groupId: string,
    @Body() dto: CreateRoomRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.createRoomRequest(groupId, user.agency_id, dto.name, user.id);
  }

  @Patch(':groupId/room-requests/:roomRequestId')
  async updateRoomRequest(
    @Param('groupId') groupId: string,
    @Param('roomRequestId') roomRequestId: string,
    @Body() dto: UpdateRoomRequestDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.updateRoomRequest(groupId, roomRequestId, user.agency_id, dto.name);
  }

  @Delete(':groupId/room-requests/:roomRequestId')
  async deleteRoomRequest(
    @Param('groupId') groupId: string,
    @Param('roomRequestId') roomRequestId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.deleteRoomRequest(groupId, roomRequestId, user.agency_id);
  }

  @Post(':groupId/room-requests/:roomRequestId/members')
  async addRoomRequestMember(
    @Param('groupId') groupId: string,
    @Param('roomRequestId') roomRequestId: string,
    @Body() dto: AddRoomRequestMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addRoomRequestMember(groupId, roomRequestId, user.agency_id, dto.pilgrim_id);
  }

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

  @Post(':groupId/rooms')
  async createRooms(
    @Param('groupId') groupId: string,
    @Body() dto: CreateRoomsDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.createRooms(groupId, user.agency_id, dto.rooms, user.id);
  }

  @Delete(':groupId/rooms/:roomId')
  async deleteRoom(
    @Param('groupId') groupId: string,
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.deleteRoom(groupId, roomId, user.agency_id);
  }

  @Post(':groupId/rooms/:roomId/members')
  async addRoomMember(
    @Param('groupId') groupId: string,
    @Param('roomId') roomId: string,
    @Body() dto: AddRoomMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addRoomMember(groupId, roomId, user.agency_id, dto.pilgrim_id);
  }

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

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateGroupDto: UpdateGroupDto, @CurrentUser() user: any) {
    return this.groupsService.update(id, user.agency_id, updateGroupDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.groupsService.remove(id, user.agency_id);
  }
}
