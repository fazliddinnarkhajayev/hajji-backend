import { Injectable, Inject } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { PaginatedResult } from '../interfaces/pagination.interface';

@Injectable()
export class BaseDao<T extends { id: string }> {
  protected readonly db: Knex;

  constructor(
    protected readonly tableName: string,
    @Inject(KNEX_CONNECTION) db: Knex,
  ) {
    this.db = db;
  }

  protected qb(trx?: Knex.Transaction): Knex.QueryBuilder {
    return trx ? trx(this.tableName) : this.db(this.tableName);
  }

  async transaction<R>(callback: (trx: Knex.Transaction) => Promise<R>): Promise<R> {
    return this.db.transaction(callback);
  }

  async findById(id: string, trx?: Knex.Transaction): Promise<T | undefined> {
    const record = await this.qb(trx).where({ id, is_deleted: false }).whereNull('deleted_at').first();
    return record as T | undefined;
  }

  async findOne(where: Partial<T>, trx?: Knex.Transaction): Promise<T | undefined> {
    const record = await this.qb(trx).where({ ...where, is_deleted: false } as Record<string, unknown>).whereNull('deleted_at').first();
    return record as T | undefined;
  }

  async findMany(where: Partial<T> = {}, trx?: Knex.Transaction): Promise<T[]> {
    const records = await this.qb(trx).where({ ...where, is_deleted: false } as Record<string, unknown>).whereNull('deleted_at');
    return records as T[];
  }

  async findManyPaginated(
    where: Partial<T> = {},
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ): Promise<PaginatedResult<T>> {
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .where({ ...where, is_deleted: false } as Record<string, unknown>)
      .whereNull('deleted_at')
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    const records = await this.qb(trx)
      .where({ ...where, is_deleted: false } as Record<string, unknown>)
      .whereNull('deleted_at')
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as T[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  async exists(where: Partial<T>, trx?: Knex.Transaction): Promise<boolean> {
    const record = await this.qb(trx).where({ ...where, is_deleted: false } as Record<string, unknown>).whereNull('deleted_at').first();
    return !!record;
  }

  async insert(payload: Partial<T>, trx?: Knex.Transaction): Promise<T> {
    const [record] = await this.qb(trx)
      .insert(payload as Record<string, unknown>)
      .returning('*');
    return record as T;
  }

  async updateById(id: string, payload: Partial<T>, trx?: Knex.Transaction): Promise<T | undefined> {
    const [record] = await this.qb(trx)
      .where({ id })
      .update(payload as Record<string, unknown>)
      .returning('*');

    return record as T | undefined;
  }

  async deleteById(id: string, trx?: Knex.Transaction): Promise<boolean> {
    const affected = await this.qb(trx)
      .where({ id })
      .update({ deleted_at: new Date(), is_deleted: true } as Record<string, unknown>);
    return affected > 0;
  }
}
