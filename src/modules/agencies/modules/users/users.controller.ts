import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AgencyUsersManagementService } from './users.service';
import { CurrentUser } from 'src/shared/decorators';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { CreateAgencyUserDto } from './dto/create-agency-user.dto';
import { UpdateAgencyUserDto } from './dto/update-agency-user.dto';
import { ChangeAgencyUserStatusDto } from './dto/change-status.dto';

@Controller('agencies/users')
export class AgencyUsersManagementController {
  constructor(private readonly service: AgencyUsersManagementService) {}

  @Get()
  findAll(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.service.findAll(user.agency_id, pagination);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateAgencyUserDto) {
    return this.service.create(user.agency_id, dto);
  }

  @Patch(':userId')
  update(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Body() dto: UpdateAgencyUserDto,
  ) {
    return this.service.update(user.agency_id, userId, dto);
  }

  @Patch(':userId/status')
  changeStatus(
    @CurrentUser() user: any,
    @Param('userId') userId: string,
    @Body() dto: ChangeAgencyUserStatusDto,
  ) {
    return this.service.changeStatus(user.agency_id, userId, dto.status);
  }

  @Delete(':userId')
  remove(@CurrentUser() user: any, @Param('userId') userId: string) {
    return this.service.remove(user.agency_id, userId);
  }
}
