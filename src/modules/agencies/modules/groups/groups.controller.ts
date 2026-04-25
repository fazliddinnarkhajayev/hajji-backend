import { Controller, Get, Post, Param, Query, Patch, Body, Put, Delete } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CurrentUser } from 'src/shared/decorators';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddPilgrimToGroupDto } from './dto/add-pilgrim-to-group.dto';

@Controller('agencies/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.create(user.agency_id, createGroupDto);
  }

  @Get()
  async getAll(
    @CurrentUser() user: any,
    @Query() query: any,
  ) {
    const { page = '1', limit = '10' } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    return this.groupsService.findByAgency(user.agency_id, pageIndex, pageSize);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.findOne(id, user.agency_id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.update(id, user.agency_id, updateGroupDto);
  }

  /**
   * Add a pilgrim to a group
   * POST /agencies/groups/:groupId/members
   */
  @Post(':groupId/members')
  async addPilgrimToGroup(
    @Param('groupId') groupId: string,
    @Body() dto: AddPilgrimToGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.addPilgrimToGroup(groupId, user.agency_id, dto.pilgrim_id);
  }

  /**
   * Remove a pilgrim from a group
   * DELETE /agencies/groups/:groupId/members/:pilgrimId
   */
  @Delete(':groupId/members/:pilgrimId')
  async removePilgrimFromGroup(
    @Param('groupId') groupId: string,
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.removePilgrimFromGroup(groupId, user.agency_id, pilgrimId);
  }

  /**
   * Get all members in a group
   * GET /agencies/groups/:groupId/members
   */
  @Get(':groupId/members')
  async getPilgrimsInGroup(
    @Param('groupId') groupId: string,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.getPilgrimsInGroup(groupId, user.agency_id);
  }
}
