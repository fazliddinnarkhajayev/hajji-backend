import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';

export interface OtpSessionRecord {
  id: string;
  phone: string;
  code: string;
  method: 'SMS' | 'TELEGRAM';
  attempts: number;
  is_used: boolean;
  status: 'PENDING' | 'VERIFIED' | 'EXPIRED' | 'USED';
  is_deleted: boolean;
  expires_at: Date;
  created_at: Date;
}

@Injectable()
export class OtpSessionsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  private qb(trx?: Knex.Transaction) {
    return trx
      ? trx<OtpSessionRecord>(TABLE_NAMES.OTP_SESSIONS)
      : this.db<OtpSessionRecord>(TABLE_NAMES.OTP_SESSIONS);
  }

  async transaction<R>(callback: (trx: Knex.Transaction) => Promise<R>): Promise<R> {
    return this.db.transaction(callback);
  }

  async createOtpSession(
    phone: string,
    code: string,
    method: 'SMS' | 'TELEGRAM',
    expiresAt: Date,
    trx?: Knex.Transaction,
  ): Promise<OtpSessionRecord> {
    const [record] = await this.qb(trx)
      .insert({
        id: randomUUID(),
        phone,
        code,
        method,
        attempts: 0,
        is_used: false,
        status: 'PENDING',
        is_deleted: false,
        expires_at: expiresAt,
      })
      .returning('*');

    return record;
  }

  async findLatestOtpSession(phone: string, trx?: Knex.Transaction): Promise<OtpSessionRecord | undefined> {
    return this.qb(trx)
      .where({ phone, is_deleted: false })
      .where('expires_at', '>', this.db.fn.now())
      .orderBy('created_at', 'desc')
      .first();
  }

  async verifyOtpSession(id: string, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ id })
      .update({
        is_used: true,
        status: 'USED',
      });
  }

  // Marks a code as verified but NOT yet consumed — used when an unregistered
  // phone passes OTP and is about to register. `register` later requires such a
  // session and then consumes it via markUsed().
  async markVerified(id: string, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ id })
      .update({ is_used: false, status: 'VERIFIED' });
  }

  async markUsed(id: string, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ id })
      .update({ is_used: true, status: 'USED' });
  }

  // Latest VERIFIED (but not yet consumed) session for a phone since `since`.
  // Backs registration's proof-of-OTP check.
  async findVerifiedByPhone(
    phone: string,
    since: Date,
    trx?: Knex.Transaction,
  ): Promise<OtpSessionRecord | undefined> {
    return this.qb(trx)
      .where({ phone, status: 'VERIFIED', is_deleted: false })
      .where('created_at', '>=', since)
      .orderBy('created_at', 'desc')
      .first();
  }

  async incrementOtpAttempts(id: string, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ id })
      .increment('attempts', 1);
  }
}
