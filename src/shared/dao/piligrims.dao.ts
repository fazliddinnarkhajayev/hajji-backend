import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';

export interface Pilgrim {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  middle_name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  country_id?: string | null;
  region_id?: string | null;
  district_id?: string | null;
  agency_id?: string | null;
  language?: string;
  user_id: string;
  status: 'ACTIVE' | 'BLOCKED';
  is_blocked: boolean;
  is_guide?: boolean;
  blocked_at?: Date | null;
  notifications_enabled?: boolean;
  elderly_mode?: boolean;
  theme?: string;
  created_at?: Date;
  created_by_id?: string | null;
  updated_at?: Date;
  updated_by_id?: string | null;
  is_deleted?: boolean;
  // Joined data
  country?: {
    id?: string;
    name?: string;
    soato?: string;
  };
  region?: {
    id?: string;
    name?: string;
    soato?: string;
  };
  district?: {
    id?: string;
    name?: string;
    soato?: string;
  };
  agency?: {
    id?: string;
    name?: string;
  } | null;
}

@Injectable()
export class PilgrimsDao extends BaseDao<Pilgrim> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.PILGRIMS, db);
  }

  async findByUserId(userId: string, trx?: Knex.Transaction): Promise<Pilgrim | undefined> {
    const record = await this.qb(trx).where({ user_id: userId, is_deleted: false }).first();
    return record as Pilgrim | undefined;
  }

  async findByPhone(phone: string, trx?: Knex.Transaction): Promise<Pilgrim | undefined> {
    const record = await this.qb(trx).where({ phone, is_deleted: false }).first();
    return record as Pilgrim | undefined;
  }

  async findByEmail(email: string, trx?: Knex.Transaction): Promise<Pilgrim | undefined> {
    const record = await this.qb(trx).where({ email, is_deleted: false }).first();
    return record as Pilgrim | undefined;
  }

  async updateLanguage(
    id: string,
    language: string,
    trx?: Knex.Transaction,
  ): Promise<Pilgrim | undefined> {
    return this.updateById(id, { language, updated_at: new Date() } as Partial<Pilgrim>, trx);
  }

  async updateNotifications(
    id: string,
    enabled: boolean,
    trx?: Knex.Transaction,
  ): Promise<Pilgrim | undefined> {
    return this.updateById(
      id,
      { notifications_enabled: enabled, updated_at: new Date() } as Partial<Pilgrim>,
      trx,
    );
  }

  async updateAvatar(
    id: string,
    avatarUrl: string,
    trx?: Knex.Transaction,
  ): Promise<Pilgrim | undefined> {
    return this.updateById(
      id,
      { avatar_url: avatarUrl, updated_at: new Date() } as Partial<Pilgrim>,
      trx,
    );
  }

  async findByUserIdWithJoins(userId: string, trx?: Knex.Transaction): Promise<Pilgrim | undefined> {
    const record = await this.qb(trx)
      .leftJoin(TABLE_NAMES.COUNTRIES, `${TABLE_NAMES.PILGRIMS}.country_id`, `${TABLE_NAMES.COUNTRIES}.id`)
      .leftJoin(TABLE_NAMES.REGIONS, `${TABLE_NAMES.PILGRIMS}.region_id`, `${TABLE_NAMES.REGIONS}.id`)
      .leftJoin(TABLE_NAMES.DISTRICTS, `${TABLE_NAMES.PILGRIMS}.district_id`, `${TABLE_NAMES.DISTRICTS}.id`)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.COUNTRIES}.id, 'name', ${TABLE_NAMES.COUNTRIES}.name, 'soato', ${TABLE_NAMES.COUNTRIES}.soato) as country`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.REGIONS}.id, 'name', ${TABLE_NAMES.REGIONS}.name, 'soato', ${TABLE_NAMES.REGIONS}.soato) as region`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.DISTRICTS}.id, 'name', ${TABLE_NAMES.DISTRICTS}.name, 'soato', ${TABLE_NAMES.DISTRICTS}.soato) as district`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .where({ [`${TABLE_NAMES.PILGRIMS}.user_id`]: userId, [`${TABLE_NAMES.PILGRIMS}.is_deleted`]: false })
      .first();

    return record as Pilgrim | undefined;
  }

  async findByIdWithJoins(id: string, trx?: Knex.Transaction): Promise<Pilgrim | undefined> {
    const record = await this.qb(trx)
      .leftJoin(TABLE_NAMES.COUNTRIES, `${TABLE_NAMES.PILGRIMS}.country_id`, `${TABLE_NAMES.COUNTRIES}.id`)
      .leftJoin(TABLE_NAMES.REGIONS, `${TABLE_NAMES.PILGRIMS}.region_id`, `${TABLE_NAMES.REGIONS}.id`)
      .leftJoin(TABLE_NAMES.DISTRICTS, `${TABLE_NAMES.PILGRIMS}.district_id`, `${TABLE_NAMES.DISTRICTS}.id`)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.COUNTRIES}.id, 'name', ${TABLE_NAMES.COUNTRIES}.name, 'soato', ${TABLE_NAMES.COUNTRIES}.soato) as country`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.REGIONS}.id, 'name', ${TABLE_NAMES.REGIONS}.name, 'soato', ${TABLE_NAMES.REGIONS}.soato) as region`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.DISTRICTS}.id, 'name', ${TABLE_NAMES.DISTRICTS}.name, 'soato', ${TABLE_NAMES.DISTRICTS}.soato) as district`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .where({ [`${TABLE_NAMES.PILGRIMS}.id`]: id, [`${TABLE_NAMES.PILGRIMS}.is_deleted`]: false })
      .first();

    return record as Pilgrim | undefined;
  }

  async findAllWithJoins(trx?: Knex.Transaction): Promise<Pilgrim[]> {
    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .where({ [`${TABLE_NAMES.PILGRIMS}.is_deleted`]: false });

    return records as Pilgrim[];
  }

  async findManyPaginated(
    where: Partial<Pilgrim> = {},
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ) {
    const { PaginatedResult } = await import('../interfaces/pagination.interface');
    
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .where((builder) => {
        Object.entries(where).forEach(([key, value]) => {
          if (key !== 'is_deleted') {
            builder.where(`${TABLE_NAMES.PILGRIMS}.${key}`, value);
          }
        });
        builder.where(`${TABLE_NAMES.PILGRIMS}.is_deleted`, false);
      })
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .where((builder) => {
        Object.entries(where).forEach(([key, value]) => {
          if (key !== 'is_deleted') {
            builder.where(`${TABLE_NAMES.PILGRIMS}.${key}`, value);
          }
        });
        builder.where(`${TABLE_NAMES.PILGRIMS}.is_deleted`, false);
      })
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as Pilgrim[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  async findManyPaginatedWithPhone(
    where: Partial<Pilgrim> = {},
    phone: string,
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ) {
    const { PaginatedResult } = await import('../interfaces/pagination.interface');
    
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .where((builder) => {
        Object.entries(where).forEach(([key, value]) => {
          if (key !== 'is_deleted') {
            builder.where(`${TABLE_NAMES.PILGRIMS}.${key}`, value);
          }
        });
        builder.where(`${TABLE_NAMES.PILGRIMS}.is_deleted`, false);
      })
      .where(`${TABLE_NAMES.PILGRIMS}.phone`, 'ILIKE', `%${phone}%`)
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .where((builder) => {
        Object.entries(where).forEach(([key, value]) => {
          if (key !== 'is_deleted') {
            builder.where(`${TABLE_NAMES.PILGRIMS}.${key}`, value);
          }
        });
        builder.where(`${TABLE_NAMES.PILGRIMS}.is_deleted`, false);
      })
      .where(`${TABLE_NAMES.PILGRIMS}.phone`, 'ILIKE', `%${phone}%`)
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as Pilgrim[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  async findGuidesByAgency(agencyId: string, trx?: Knex.Transaction): Promise<Pilgrim[]> {
    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .where({
        [`${TABLE_NAMES.PILGRIMS}.agency_id`]: agencyId,
        [`${TABLE_NAMES.PILGRIMS}.is_guide`]: true,
        [`${TABLE_NAMES.PILGRIMS}.is_deleted`]: false,
      })
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .orderBy(`${TABLE_NAMES.PILGRIMS}.first_name`);

    return records as Pilgrim[];
  }
}
