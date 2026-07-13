import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PilgrimsDao, Pilgrim } from 'src/shared/dao/piligrims.dao';
import { PilgrimDeleteRequestDao, PilgrimDeleteRequest } from 'src/shared/dao/pilgrim-delete-request.dao';
import { UserProfile, UserProfileSettings } from './profile.interface';

const VALID_LANGUAGES = ['uz', 'ru', 'en'];

@Injectable()
export class ProfileService {
  constructor(
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly deleteRequestDao: PilgrimDeleteRequestDao,
  ) {}

  /** The pilgrim's current active account-deletion request, or null. */
  async getDeleteRequest(pilgrimId: string): Promise<PilgrimDeleteRequest | null> {
    const request = await this.deleteRequestDao.findActiveByPilgrimId(pilgrimId);
    return request || null;
  }

  /**
   * Create a PENDING account-deletion request. Idempotent: if one is already
   * active, return it rather than creating a duplicate.
   */
  async createDeleteRequest(pilgrimId: string): Promise<PilgrimDeleteRequest> {
    const existing = await this.deleteRequestDao.findActiveByPilgrimId(pilgrimId);
    if (existing) return existing;
    return this.deleteRequestDao.insert({ pilgrim_id: pilgrimId, status: 'PENDING' });
  }

  /** Cancel the pilgrim's active deletion request (sets CANCELLED). */
  async cancelDeleteRequest(pilgrimId: string): Promise<PilgrimDeleteRequest> {
    const existing = await this.deleteRequestDao.findActiveByPilgrimId(pilgrimId);
    if (!existing) {
      throw new NotFoundException('No active delete request found');
    }
    const updated = await this.deleteRequestDao.updateById(existing.id, {
      status: 'CANCELLED',
      updated_at: new Date(),
    });
    return updated as PilgrimDeleteRequest;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const profile = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return this.mapPilgrimToUserProfile(profile);
  }

  async getProfileById(id: string): Promise<UserProfile> {
    const profile = await this.pilgrimsDao.findByIdWithJoins(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return this.mapPilgrimToUserProfile(profile);
  }

  async updateLanguage(id: string, language: string): Promise<UserProfile> {
    if (!VALID_LANGUAGES.includes(language)) {
      throw new BadRequestException('Invalid language code');
    }

    const profile = await this.pilgrimsDao.updateLanguage(id, language);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapPilgrimToUserProfile(profile);
  }

  async updateNotifications(id: string, enabled: boolean): Promise<UserProfile> {
    const profile = await this.pilgrimsDao.updateNotifications(id, enabled);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapPilgrimToUserProfile(profile);
  }

  async updateProfile(id: string, data: Partial<UserProfile>): Promise<UserProfile> {
    // Validate language if provided
    if (data.language && !VALID_LANGUAGES.includes(data.language)) {
      throw new BadRequestException('Invalid language code');
    }

    // Check if email is already taken
    if (data.email) {
      const existing = await this.pilgrimsDao.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Check if phone is already taken
    if (data.phone) {
      const existing = await this.pilgrimsDao.findByPhone(data.phone);
      if (existing && existing.id !== id) {
        throw new BadRequestException('Phone already in use');
      }
    }

    const pilgrimData = this.mapUserProfileToPilgrim(data);
    const profile = await this.pilgrimsDao.updateById(id, pilgrimData);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapPilgrimToUserProfile(profile);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<UserProfile> {
    const profile = await this.pilgrimsDao.updateAvatar(id, avatarUrl);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return this.mapPilgrimToUserProfile(profile);
  }

  async getProfileSettings(id: string): Promise<UserProfileSettings> {
    const profile = await this.pilgrimsDao.findByIdWithJoins(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      notifications_enabled: profile.notifications_enabled ?? true,
      elderly_mode: profile.elderly_mode ?? false,
      language: profile.language ?? 'uz',
      theme: profile.theme ?? 'auto',
    };
  }

  private mapPilgrimToUserProfile(pilgrim: Pilgrim): UserProfile {
    const fullName = [pilgrim.first_name, pilgrim.middle_name, pilgrim.last_name].filter(Boolean).join(' ');
    return {
      id: pilgrim.id,
      full_name: fullName || '',
      first_name: pilgrim.first_name || null,
      last_name: pilgrim.last_name || null,
      middle_name: pilgrim.middle_name || null,
      phone: pilgrim.phone || null,
      pinfl: pilgrim.pinfl || null,
      email: pilgrim.email || null,
      avatar_url: pilgrim.avatar_url || null,
      language: pilgrim.language || 'uz',
      is_guide: pilgrim.is_guide || false,
      user_id: pilgrim.user_id,
      status: pilgrim.status,
      notifications_enabled: pilgrim.notifications_enabled ?? true,
      elderly_mode: pilgrim.elderly_mode ?? false,
      theme: pilgrim.theme ?? 'auto',
      created_at: pilgrim.created_at || new Date(),
      updated_at: pilgrim.updated_at || new Date(),
      is_deleted: pilgrim.is_deleted ?? false,
      // Include joined data
      country: pilgrim.country,
      region: pilgrim.region,
      district: pilgrim.district,
      agency: pilgrim.agency,
      group_id: pilgrim.group_id ?? null,
      group: pilgrim.group ?? null,
    };
  }

  private mapUserProfileToPilgrim(userProfile: Partial<UserProfile>): Partial<Pilgrim> {
    return {
      first_name: userProfile.first_name,
      last_name: userProfile.last_name,
      middle_name: userProfile.middle_name,
      phone: userProfile.phone,
      email: userProfile.email,
      avatar_url: userProfile.avatar_url,
      region: userProfile.region,
      district: userProfile.district,
      language: userProfile.language,
      notifications_enabled: userProfile.notifications_enabled,
      elderly_mode: userProfile.elderly_mode,
      theme: userProfile.theme,
    };
  }
}

