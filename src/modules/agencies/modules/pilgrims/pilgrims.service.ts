import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join, normalize } from 'path';
import { Knex } from 'knex';
import { BaseService } from 'src/shared/services/base.service';
import { PilgrimsDao, Pilgrim } from 'src/shared/dao/piligrims.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { UsersService } from 'src/modules/users/users.service';
import { UserTypesEnum } from 'src/shared/enums/user-types.enum';
import { JwtPayload } from 'src/shared/guards/jwt-auth.guard';
import { SundryService } from 'src/shared/services/sundry.service';
import { CreatePilgrimDto } from './dto/create-pilgrim.dto';
import { UpdatePilgrimDto } from './dto/update-pilgrim.dto';
import { TABLE_NAMES } from 'src/shared/constants';
import { PilgrimAgencyHistoryDao } from 'src/shared/dao/pilgrim-agency-history.dao';

/** Passport scans live outside the public /uploads folder. */
export const PRIVATE_DIR = join(process.cwd(), 'private');
export const PASSPORT_DIR = join(PRIVATE_DIR, 'passports');

/** users.id of the caller (JWT user_id; id when the profile was merged in). */
const actorId = (user: any): string => user?.user_id ?? user?.id;

const PASSPORT_KEYS = ['birth_date', 'gender', 'citizenship', 'passport_number', 'passport_issued_at', 'passport_expires_at'] as const;

@Injectable()
export class AgencyPilgrimsService extends BaseService<Pilgrim, PilgrimsDao> {
  constructor(
    private readonly pilgrimsDao: PilgrimsDao,
    private readonly agencyUsersDao: AgencyUsersDao,
    private readonly usersService: UsersService,
    private readonly sundryService: SundryService,
    private readonly historyDao: PilgrimAgencyHistoryDao,
  ) {
    super(pilgrimsDao);
  }

  async create(dto: CreatePilgrimDto, user: any): Promise<Pilgrim> {
    const run = async (t: Knex.Transaction) => {
      const phone = this.sundryService.normalizePhone(dto.phone);
      const newUser = await this.usersService.create(
        {
          username: phone,
          type: UserTypesEnum.PILGRIM,
          created_by_id: user.id,
        } as any,
        t,
      );

      return this.pilgrimsDao.insert(
        {
          first_name: dto.first_name,
          last_name: dto.last_name,
          middle_name: dto.middle_name,
          phone: phone,
          email: dto.email,
          country_id: dto.country_id,
          region_id: dto.region_id,
          district_id: dto.district_id,
          user_id: newUser.id,
          agency_id: user.agency_id,
          pinfl: dto.pinfl,
          ...Object.fromEntries(PASSPORT_KEYS.filter((k) => dto[k] !== undefined).map((k) => [k, dto[k]])),
        } as Partial<Pilgrim>,
        t,
      );
    };

    return this.transaction(run);
  }

  /** The pilgrim, if it belongs to this agency (404 otherwise, so ids of other agencies don't leak). */
  private async ownPilgrim(pilgrimId: string, agencyId: string, trx?: Knex.Transaction): Promise<Pilgrim> {
    const pilgrim = await this.pilgrimsDao.findById(pilgrimId, trx);
    if (!pilgrim || pilgrim.agency_id !== agencyId) throw new NotFoundException('Pilgrim not found');
    return pilgrim;
  }

  async update(pilgrimId: string, dto: UpdatePilgrimDto, user: any): Promise<Pilgrim | undefined> {
    try {
      return await this.transaction(async (t) => {
        const pilgrim = await this.ownPilgrim(pilgrimId, user.agency_id, t);
        const patch: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(dto)) if (v !== undefined) patch[k] = v;

        if (dto.phone !== undefined) {
          const phone = this.sundryService.normalizePhone(dto.phone);
          patch.phone = phone;
          if (phone !== pilgrim.phone) {
            // The phone is the pilgrim's OTP login.
            const taken = await t(TABLE_NAMES.USERS).where({ username: phone }).whereNot({ id: pilgrim.user_id }).first();
            if (taken) throw new BadRequestException('Phone is already used by another account');
            await t(TABLE_NAMES.USERS).where({ id: pilgrim.user_id }).update({ username: phone });
          }
        }
        if (Object.keys(patch).length === 0) throw new BadRequestException('Nothing to update');
        patch.updated_at = new Date();
        patch.updated_by_id = actorId(user);
        return this.pilgrimsDao.updateById(pilgrimId, patch as Partial<Pilgrim>, t);
      });
    } catch (err: any) {
      if (err?.code === '23505') throw new BadRequestException('PINFL or phone is already used by another pilgrim');
      throw err;
    }
  }

  /**
   * Removes the pilgrim from this agency: out of its group, room and room request, guide flag off,
   * agency cleared and logged. The Hajji app account stays, so the pilgrim can be invited again.
   */
  async removeFromAgency(pilgrimId: string, user: any): Promise<{ success: boolean }> {
    await this.transaction(async (t) => {
      await this.ownPilgrim(pilgrimId, user.agency_id, t);
      const leads = await t(TABLE_NAMES.GROUPS)
        .where({ guide_pilgrim_id: pilgrimId, is_deleted: false })
        .whereNot({ status: 'CANCELLED' })
        .whereRaw('return_date::date >= CURRENT_DATE')
        .first('name');
      if (leads) throw new BadRequestException(`Pilgrim is the guide of group "${leads.name}"`);

      await t(TABLE_NAMES.ROOM_MEMBERS).where({ pilgrim_id: pilgrimId }).delete();
      await t(TABLE_NAMES.ROOM_REQUEST_MEMBERS).where({ pilgrim_id: pilgrimId }).delete();
      await t(TABLE_NAMES.GROUP_MEMBERS).where({ pilgrim_id: pilgrimId }).delete();
      await this.pilgrimsDao.updateById(pilgrimId, {
        agency_id: null,
        is_guide: false,
        updated_at: new Date(),
        updated_by_id: actorId(user),
      } as Partial<Pilgrim>, t);
      await this.historyDao.createHistory({
        pilgrim_id: pilgrimId,
        agency_id: user.agency_id,
        user_id: actorId(user),
        action: 'REMOVE',
        notes: 'Removed by agency',
      }, t);
    });
    return { success: true };
  }

  /** Stores the uploaded scan (already written by multer) and drops the previous one. */
  async setPassportPhoto(pilgrimId: string, file: { filename: string } | undefined, user: any) {
    if (!file) throw new BadRequestException('file is required (JPG, PNG, WEBP or PDF up to 10 MB)');
    const path = join('passports', file.filename);
    let pilgrim: Pilgrim;
    try {
      pilgrim = await this.ownPilgrim(pilgrimId, user.agency_id);
    } catch (e) {
      this.removeFile(path);
      throw e;
    }
    await this.pilgrimsDao.updateById(pilgrimId, { passport_photo_path: path, updated_at: new Date(), updated_by_id: actorId(user) } as Partial<Pilgrim>);
    if (pilgrim.passport_photo_path && pilgrim.passport_photo_path !== path) this.removeFile(pilgrim.passport_photo_path);
    return { success: true, has_passport_photo: true };
  }

  /** Absolute path of the pilgrim's scan, for streaming it back to the agency. */
  async getPassportPhotoFile(pilgrimId: string, user: any): Promise<string> {
    const pilgrim = await this.ownPilgrim(pilgrimId, user.agency_id);
    const abs = pilgrim.passport_photo_path ? this.privatePath(pilgrim.passport_photo_path) : null;
    if (!abs || !existsSync(abs)) throw new NotFoundException('Passport photo not found');
    return abs;
  }

  private privatePath(rel: string): string | null {
    const abs = normalize(join(PRIVATE_DIR, rel));
    return abs.startsWith(PRIVATE_DIR) ? abs : null;
  }

  private removeFile(rel: string) {
    const abs = this.privatePath(rel);
    try { if (abs && existsSync(abs)) unlinkSync(abs); } catch { /* best effort */ }
  }

  async getAgencyPilgrims(user: any, query: any) {
    const { page = '1', limit = '10', phone, is_guide, has_group } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Build filter criteria
    const where: any = { is_deleted: false, agency_id: user.agency_id };

    // Apply is_guide filter if provided
    if (is_guide !== undefined) {
      where.is_guide = is_guide === 'true';
    }

    // has_group=false → only pilgrims not yet in any group (for "add member" pickers)
    if (has_group !== undefined) {
      where.has_group = has_group === 'true';
    }

    // Apply phone filter if provided (using ILIKE for case-insensitive partial matching)
    if (phone) {
      const normalizedPhone = this.sundryService.normalizePhone(phone);
      return await this.pilgrimsDao.findManyPaginatedWithPhone(where, normalizedPhone, pageIndex, pageSize);
    }

    // Fetch all pilgrims without phone filter
    return await this.pilgrimsDao.findManyPaginated(where, pageIndex, pageSize);
  }

  async getPilgrimDetails(userId: string) {
    const pilgrim = await this.pilgrimsDao.findByUserIdWithJoins(userId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }
    return pilgrim;
  }

  async setAsGuide(pilgrimId: string, agencyId: string): Promise<any> {
    // Get the pilgrim
    const pilgrim = await this.pilgrimsDao.findById(pilgrimId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }

    // Verify the pilgrim belongs to this agency
    if (pilgrim.agency_id !== agencyId) {
      throw new BadRequestException('Pilgrim does not belong to this agency');
    }

    // Update the pilgrim as guide
    return this.pilgrimsDao.updateById(pilgrimId, {
      is_guide: true,
      updated_at: new Date(),
    } as Partial<Pilgrim>);
  }

  async removeAsGuide(pilgrimId: string, agencyId: string): Promise<any> {
    // Get the pilgrim
    const pilgrim = await this.pilgrimsDao.findById(pilgrimId);
    if (!pilgrim) {
      throw new NotFoundException('Pilgrim not found');
    }

    // Verify the pilgrim belongs to this agency
    if (pilgrim.agency_id !== agencyId) {
      throw new BadRequestException('Pilgrim does not belong to this agency');
    }

    // Update the pilgrim to remove guide status
    return this.pilgrimsDao.updateById(pilgrimId, {
      is_guide: false,
      updated_at: new Date(),
    } as Partial<Pilgrim>);
  }

  async searchPilgrimsByPhoneOrPinfl(query: any) {
    const { page = '1', limit = '10', search } = query;
    if (!search) {
      return await this.pilgrimsDao.findManyPaginated({ is_deleted: false }, 1, 10);
    }
    const normalized = this.sundryService.normalizePhone(search);
    return await this.pilgrimsDao.searchByPhoneOrPinfl(normalized, parseInt(page, 10), parseInt(limit, 10));
  }

  async getGuides(user: any, query: any) {
    const { page = '1', limit = '10', has_group } = query;
    const pageIndex = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);

    // Get guides for this agency
    const where: any = { is_deleted: false, agency_id: user.agency_id, is_guide: true };
    
    // Apply has_group filter if provided
    if (has_group !== undefined) {
      const hasGroupBool = has_group === 'true';
      return await this.pilgrimsDao.findGuidesPaginatedWithGroupFilter(where, pageIndex, pageSize, hasGroupBool);
    }
    
    return await this.pilgrimsDao.findManyPaginated(where, pageIndex, pageSize);
  }
}
