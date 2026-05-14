import { Controller, Get, Post, Param, Query, Patch, Body, Put, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CurrentUser } from 'src/shared/decorators';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddPilgrimToGroupDto } from './dto/add-pilgrim-to-group.dto';
import { CreateRoomGroupDto } from './dto/create-room-group.dto';
import { UpdateRoomGroupDto } from './dto/update-room-group.dto';
import { AddRoomGroupMemberDto } from './dto/add-room-group-member.dto';

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
  async getPilgrimsInGroup(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.getPilgrimsInGroup(groupId, user.agency_id);
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

  @Get(':groupId/room-groups')
  async getRoomGroups(@Param('groupId') groupId: string, @CurrentUser() user: any) {
    return this.groupsService.getRoomGroups(groupId, user.agency_id);
  }

  @Post(':groupId/room-groups')
  async createRoomGroup(
    @Param('groupId') groupId: string,
    @Body() dto: CreateRoomGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.createRoomGroup(groupId, user.agency_id, dto.name, user.id);
  }

  @Patch(':groupId/room-groups/:roomGroupId')
  async updateRoomGroup(
    @Param('groupId') groupId: string,
    @Param('roomGroupId') roomGroupId: string,
    @Body() dto: UpdateRoomGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.updateRoomGroup(groupId, roomGroupId, user.agency_id, dto.name);
  }

  @Delete(':groupId/room-groups/:roomGroupId')
  async deleteRoomGroup(
    @Param('groupId') groupId: string,
    @Param('roomGroupId') roomGroupId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.deleteRoomGroup(groupId, roomGroupId, user.agency_id);
  }

  @Post(':groupId/room-groups/:roomGroupId/members')
  async addRoomGroupMember(
    @Param('groupId') groupId: string,
    @Param('roomGroupId') roomGroupId: string,
    @Body() dto: AddRoomGroupMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addRoomGroupMember(groupId, roomGroupId, user.agency_id, dto.pilgrim_id);
  }

  @Delete(':groupId/room-groups/:roomGroupId/members/:pilgrimId')
  async removeRoomGroupMember(
    @Param('groupId') groupId: string,
    @Param('roomGroupId') roomGroupId: string,
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removeRoomGroupMember(groupId, roomGroupId, user.agency_id, pilgrimId);
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
