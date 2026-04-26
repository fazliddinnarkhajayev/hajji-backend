import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';

export interface UserRecord {
  id: string;
  phone: string | null;
  password_hash: string | null;
  username: string | null;
  type: 'ADMIN' | 'PILGRIM';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DELETED';
  is_deleted: boolean;
  is_blocked: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class UsersAuthDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) { }

  private qb(trx?: Knex.Transaction) {
    return trx
      ? trx<UserRecord>(TABLE_NAMES.USERS)
      : this.db<UserRecord>(TABLE_NAMES.USERS);
  }

  async transaction<R>(callback: (trx: Knex.Transaction) => Promise<R>): Promise<R> {
    return this.db.transaction(callback);
  }

  async findUserById(userId: string, trx?: Knex.Transaction): Promise<UserRecord | undefined> {
    return this.qb(trx)
      .where({ id: userId })
      .first();
  }

  async findUserBy(query: Partial<UserRecord>, trx?: Knex.Transaction): Promise<UserRecord | undefined> {
    return this.qb(trx)
      .where(query)
      .first();
  }

  async findUserByEmail(username: string, trx?: Knex.Transaction): Promise<UserRecord | undefined> {
    return this.qb(trx)
      .where({ username })
      .first();
  }

  async createUser(
    type: 'ADMIN' | 'PILGRIM',
    phone: string | null = null,
    username: string | null = null,
    passwordHash: string | null = null,
    trx?: Knex.Transaction,
  ): Promise<UserRecord> {
    const [record] = await this.qb(trx)
      .insert({
        id: randomUUID(),
        phone,
        username,
        password_hash: passwordHash,
        type,
        status: 'ACTIVE',
        is_blocked: false,
        last_login_at: null,
      })
      .returning('*');

    return record;
  }

  async updateLoginAt(userId: string, trx?: Knex.Transaction): Promise<void> {
    await this.qb(trx)
      .where({ id: userId })
      .update({
        last_login_at: this.db.fn.now() as unknown as Date
      });
  }
}
