import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { BaseDao } from 'src/shared/dao/base.dao';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';
import { UserProfile } from './profile.interface';

@Injectable()
export class ProfileDao extends BaseDao<UserProfile> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.PILGRIMS, db);
  }

  async findByPhone(phone: string, trx?: Knex.Transaction): Promise<UserProfile | undefined> {
    const record = await this.qb(trx).where({ phone }).first();
    return record as UserProfile | undefined;
  }

  async findByEmail(email: string, trx?: Knex.Transaction): Promise<UserProfile | undefined> {
    const record = await this.qb(trx).where({ email }).first();
    return record as UserProfile | undefined;
  }

  async findByUserId(userId: string, trx?: Knex.Transaction): Promise<UserProfile | undefined> {
    const record = await this.qb(trx).where({ user_id: userId }).first();
    return record as UserProfile | undefined;
  }

  async updateLanguage(
    id: string,
    language: string,
    trx?: Knex.Transaction,
  ): Promise<UserProfile | undefined> {
    return this.updateById(id, { language, updated_at: new Date() } as Partial<UserProfile>, trx);
  }

  async updateNotifications(
    id: string,
    enabled: boolean,
    trx?: Knex.Transaction,
  ): Promise<UserProfile | undefined> {
    return this.updateById(
      id,
      { notifications_enabled: enabled, updated_at: new Date() } as Partial<UserProfile>,
      trx,
    );
  }
}

