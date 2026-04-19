import { Controller, Get, Put, Body } from '@nestjs/common';
import { AgencyProfileService } from './profile.service';
import { JwtAuthGuard, JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@Controller('agencies/profile')
export class AgencyProfileController {
  constructor(private readonly profileService: AgencyProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.profileService.getProfile(user);
  }

  @Put()
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() data: any,
  ) {
    return this.profileService.updateProfile(user, data);
  }
}
