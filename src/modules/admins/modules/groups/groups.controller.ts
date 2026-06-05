import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { CurrentUser } from 'src/shared/decorators';

@Controller('admins/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  async create(
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.create(createGroupDto, user?.id);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.groupsService.findAll(pagination.page_index, pagination.page_size);
  }

  @Get('agency/:agencyId')
  async findByAgency(
    @Param('agencyId') agencyId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.groupsService.findByAgency(agencyId, pagination.page_index, pagination.page_size);
  }

  @Get(':groupId/room-requests')
  async getRoomRequests(@Param('groupId') groupId: string) {
    return this.groupsService.getRoomRequests(groupId);
  }

  @Get(':groupId/members')
  async getGroupMembers(
    @Param('groupId') groupId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.groupsService.getGroupMembers(groupId, pagination.page_index, pagination.page_size);
  }

  @Get(':groupId/rooms')
  async getGroupRooms(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupRooms(groupId);
  }

  @Get(':groupId/plans')
  async getGroupPlans(@Param('groupId') groupId: string) {
    return this.groupsService.getGroupPlans(groupId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() user: any,
  ) {
    return this.groupsService.update(id, updateGroupDto, user?.id);
  }

  @Patch(':id/status/:status')
  async changeStatus(
    @Param('id') id: string,
    @Param('status') status: 'NEW' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
    @CurrentUser() user: any,
  ) {
    return this.groupsService.changeStatus(id, status, user?.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    await this.groupsService.remove(id, user?.id);
    return { success: true };
  }
}
