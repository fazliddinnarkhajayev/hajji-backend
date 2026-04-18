import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/shared/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators';
import { ProfileService } from './profile.service';
import { UserProfile, UserProfileSettings } from './profile.interface';

@UseGuards(JwtAuthGuard)
@Controller('mobile/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@CurrentUser() user: any): Promise<UserProfile> {
    return this.profileService.getUserProfile(user.id || user.id || user.sub);
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: any): Promise<UserProfileSettings> {
    const profile = await this.profileService.getUserProfile(user.id || user.id || user.sub);
    return this.profileService.getProfileSettings(profile.id);
  }

  @Put('language')
  @HttpCode(200)
  async updateLanguage(
    @CurrentUser() user: any,
    @Body() body: { language: 'uz' | 'ru' | 'en' },
  ): Promise<UserProfile> {
    const profile = await this.profileService.getUserProfile(user.id || user.id || user.sub);
    return this.profileService.updateLanguage(profile.id, body.language);
  }

  @Put('notifications')
  @HttpCode(200)
  async updateNotifications(
    @CurrentUser() user: any,
    @Body() body: { notifications_enabled: boolean },
  ): Promise<UserProfile> {
    const profile = await this.profileService.getUserProfile(user.id || user.id || user.sub);
    return this.profileService.updateNotifications(profile.id, body.notifications_enabled);
  }

  @Put('me')
  @HttpCode(200)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() data: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const profile = await this.profileService.getUserProfile(user.id || user.id || user.sub);
    return this.profileService.updateProfile(profile.id, data);
  }

  @Post('avatar')
  @HttpCode(200)
  async updateAvatar(
    @CurrentUser() user: any,
    @Body() body: { avatar_url: string },
  ): Promise<{ avatar_url: string }> {
    const profile = await this.profileService.getUserProfile(user.id || user.id || user.sub);
    const updated = await this.profileService.updateAvatar(profile.id, body.avatar_url);
    return { avatar_url: updated.avatar_url || '' };
  }
}

