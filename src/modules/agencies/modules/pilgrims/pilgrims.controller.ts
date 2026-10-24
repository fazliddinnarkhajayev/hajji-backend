import { Controller, Get, Post, Body, Param, Query, Patch, Delete, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { AgencyPilgrimsService, PASSPORT_DIR } from './pilgrims.service';
import { UpdatePilgrimDto } from './dto/update-pilgrim.dto';
import { AgencyRoles } from 'src/shared/decorators';
import { AgencyRolesGuard } from 'src/shared/guards/agency-roles.guard';
import { AgencyUserRoleEnum } from 'src/shared/enums/agency-user-role.enum';

const PASSPORT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.pdf': 'application/pdf',
};
import { JwtAuthGuard, JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { CreatePilgrimDto } from './dto/create-pilgrim.dto';

@UseGuards(AgencyRolesGuard)
@Controller('agencies/pilgrims')
export class AgencyPilgrimsController {
  constructor(private readonly pilgrimsService: AgencyPilgrimsService) {}

  @Post()
  async create(
    @Body() dto: CreatePilgrimDto,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.create(dto, user);
  }

  @Get()
  async getAgencyPilgrims(
    @CurrentUser() user: JwtPayload,
    @Query() query: any,
  ) {
    return this.pilgrimsService.getAgencyPilgrims(user, query);
  }

  @Get('guides')
  async getGuides(
    @CurrentUser() user: JwtPayload,
    @Query() query: any,
  ) {
    return this.pilgrimsService.getGuides(user, query);
  }

  @Get('search')
  async searchPilgrims(@Query() query: any) {
    return this.pilgrimsService.searchPilgrimsByPhoneOrPinfl(query);
  }

  @Get(':userId')
  async getPilgrimDetails(@Param('userId') userId: string) {
    return this.pilgrimsService.getPilgrimDetails(userId);
  }

  @Patch(':pilgrimId')
  async update(
    @Param('pilgrimId') pilgrimId: string,
    @Body() dto: UpdatePilgrimDto,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.update(pilgrimId, dto, user);
  }

  /** Takes the pilgrim out of this agency (group, room, room request too). The app account stays. */
  @AgencyRoles(AgencyUserRoleEnum.SUPERADMIN, AgencyUserRoleEnum.SUPERVISOR)
  @Delete(':pilgrimId')
  async removeFromAgency(@Param('pilgrimId') pilgrimId: string, @CurrentUser() user: any) {
    return this.pilgrimsService.removeFromAgency(pilgrimId, user);
  }

  /** Passport scan (field "file"): JPG, PNG, WEBP or PDF, up to 10 MB. Stored outside /uploads. */
  @Post(':pilgrimId/passport-photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          mkdirSync(PASSPORT_DIR, { recursive: true });
          cb(null, PASSPORT_DIR);
        },
        filename: (_req, file, cb) => cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      fileFilter: (_req, file, cb) => cb(null, !!PASSPORT_TYPES[extname(file.originalname).toLowerCase()]),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadPassportPhoto(
    @Param('pilgrimId') pilgrimId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.setPassportPhoto(pilgrimId, file, user);
  }

  @Get(':pilgrimId/passport-photo')
  async getPassportPhoto(@Param('pilgrimId') pilgrimId: string, @CurrentUser() user: any, @Res() res: Response) {
    const abs = await this.pilgrimsService.getPassportPhotoFile(pilgrimId, user);
    res.setHeader('Content-Type', PASSPORT_TYPES[extname(abs).toLowerCase()] ?? 'application/octet-stream');
    res.setHeader('Cache-Control', 'private, no-store');
    res.sendFile(abs);
  }

  @Patch(':pilgrimId/set-as-guide')
  async setAsGuide(
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.setAsGuide(pilgrimId, user.agency_id);
  }

  @Patch(':pilgrimId/remove-as-guide')
  async removeAsGuide(
    @Param('pilgrimId') pilgrimId: string,
    @CurrentUser() user: any,
  ) {
    return this.pilgrimsService.removeAsGuide(pilgrimId, user.agency_id);
  }

}