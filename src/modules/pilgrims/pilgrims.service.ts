import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BaseService } from 'src/shared/services/base.service';
import { Pilgrim, PilgrimsDao } from 'src/shared/dao/piligrims.dao';

const VALID_LANGUAGES = ['uz', 'ru', 'en'];

@Injectable()
export class PilgrimsService extends BaseService<Pilgrim, PilgrimsDao> {
  constructor(private readonly pilgrimsDao: PilgrimsDao) {
    super(pilgrimsDao);
  }

  async getProfile(userId: string): Promise<Pilgrim> {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim profile not found');
    }
    return pilgrim;
  }

  async updateLanguage(id: string, language: string): Promise<Pilgrim> {
    if (!VALID_LANGUAGES.includes(language)) {
      throw new BadRequestException('Invalid language code');
    }

    const pilgrim = await this.pilgrimsDao.updateLanguage(id, language);
    if (!pilgrim) {
      throw new NotFoundException('Profile not found');
    }

    return pilgrim;
  }

  async updateNotifications(id: string, enabled: boolean): Promise<Pilgrim> {
    const pilgrim = await this.pilgrimsDao.updateNotifications(id, enabled);
    if (!pilgrim) {
      throw new NotFoundException('Profile not found');
    }

    return pilgrim;
  }

  async updateProfile(id: string, data: Partial<Pilgrim>): Promise<Pilgrim> {
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

    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    const pilgrim = await this.pilgrimsDao.updateById(id, updateData);
    if (!pilgrim) {
      throw new NotFoundException('Profile not found');
    }

    return pilgrim;
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<Pilgrim> {
    const pilgrim = await this.pilgrimsDao.updateAvatar(id, avatarUrl);
    if (!pilgrim) {
      throw new NotFoundException('Profile not found');
    }

    return pilgrim;
  }

  async getProfileSettings(id: string): Promise<any> {
    const pilgrim = await this.pilgrimsDao.findById(id);
    if (!pilgrim) {
      throw new NotFoundException('Profile not found');
    }

    return {
      notifications_enabled: pilgrim.notifications_enabled ?? true,
      elderly_mode: pilgrim.elderly_mode ?? false,
      language: pilgrim.language ?? 'uz',
      theme: pilgrim.theme ?? 'auto',
    };
  }
}
