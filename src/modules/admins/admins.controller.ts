import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { AdminsService } from "./admins.service";
import { BlockUnblockDto } from "./dto/block-unblock.dto";
import { CreateAdminDto } from "./dto/create-admin.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { PaginationDto } from "src/shared/dto/pagination.dto";
import { IsPublic } from "src/shared/decorators";

@Controller("admins/users")
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  list(@Query() pagination: PaginationDto) {
    return this.adminsService.findAllPaginated({}, pagination.page_index, pagination.page_size);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.adminsService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateAdminDto) {
    return this.adminsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAdminDto) {
    return this.adminsService.update(id, dto);
  }

  @Patch(":id/block-status")
  blockUnblock(@Param("id") id: string, @Body() dto: BlockUnblockDto) {
    return this.adminsService.block(id, dto.is_blocked);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const data = await this.adminsService.delete(id);
    return { success: data };
  }
}
