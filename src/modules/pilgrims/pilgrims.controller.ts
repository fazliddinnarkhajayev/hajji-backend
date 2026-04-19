import { Controller, Get, Req } from '@nestjs/common';
import { JwtAuthGuard, JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { PilgrimsService } from './pilgrims.service';
import { Request } from 'express';

@Controller('pilgrims')
export class PilgrimsController {
  constructor(private readonly pilgrimsService: PilgrimsService) {}

  @Get('profile')
  async getProfile(@Req() req: Request & { user: any }) {
    return this.pilgrimsService.getProfile(req.user.id);
  }
}
