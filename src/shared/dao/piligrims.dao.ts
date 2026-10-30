import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';

export interface Pilgrim {
  id: string;
  first_name: string;
  last_name?: string | null;
  middle_name?: string | null;
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  country_id?: string | null;
  region_id?: string | null;
  district_id?: string | null;
  agency_id?: string | null;
  pinfl?: string | null;
  birth_date?: Date | string | null;
  gender?: 'MALE' | 'FEMALE' | null;
  citizenship?: string | null;
  passport_number?: string | null;
  passport_issued_at?: Date | string | null;
  passport_expires_at?: Date | string | null;
  /** Relative to <cwd>/private; served only through the agency endpoint. */
  passport_photo_path?: string | null;
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
  group_id?: string | null;
  group?: {
    id?: string;
    name?: string;
    departure_date?: Date | string | null;
    return_date?: Date | string | null;
    meeting_point?: string | null;
    status?: string | null;
    guide_name?: string | null;
    guide_phone?: string | null;
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

  async findByPinfl(pinfl: string, trx?: Knex.Transaction): Promise<Pilgrim | undefined> {
    const record = await this.qb(trx).where({ pinfl, is_deleted: false }).first();
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
      .leftJoin(TABLE_NAMES.GROUP_MEMBERS, `${TABLE_NAMES.GROUP_MEMBERS}.pilgrim_id`, `${TABLE_NAMES.PILGRIMS}.id`)
      .leftJoin(`${TABLE_NAMES.GROUPS} as grp`, 'grp.id', `${TABLE_NAMES.GROUP_MEMBERS}.group_id`)
      .leftJoin(`${TABLE_NAMES.PILGRIMS} as guide`, 'guide.id', 'grp.guide_pilgrim_id')
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.COUNTRIES}.id, 'name', ${TABLE_NAMES.COUNTRIES}.name, 'soato', ${TABLE_NAMES.COUNTRIES}.soato) as country`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.REGIONS}.id, 'name', ${TABLE_NAMES.REGIONS}.name, 'soato', ${TABLE_NAMES.REGIONS}.soato) as region`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.DISTRICTS}.id, 'name', ${TABLE_NAMES.DISTRICTS}.name, 'soato', ${TABLE_NAMES.DISTRICTS}.soato) as district`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
        `${TABLE_NAMES.GROUP_MEMBERS}.group_id`,
        this.db.raw(`CASE WHEN grp.id IS NULL THEN NULL ELSE json_build_object('id', grp.id, 'name', grp.name, 'departure_date', grp.departure_date, 'return_date', grp.return_date, 'meeting_point', grp.meeting_point, 'status', grp.status, 'guide_name', NULLIF(TRIM(CONCAT_WS(' ', guide.first_name, guide.middle_name, guide.last_name)), ''), 'guide_phone', guide.phone) END as "group"`),
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
      .leftJoin(TABLE_NAMES.GROUP_MEMBERS, `${TABLE_NAMES.GROUP_MEMBERS}.pilgrim_id`, `${TABLE_NAMES.PILGRIMS}.id`)
      .leftJoin(`${TABLE_NAMES.GROUPS} as grp`, 'grp.id', `${TABLE_NAMES.GROUP_MEMBERS}.group_id`)
      .leftJoin(`${TABLE_NAMES.PILGRIMS} as guide`, 'guide.id', 'grp.guide_pilgrim_id')
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.COUNTRIES}.id, 'name', ${TABLE_NAMES.COUNTRIES}.name, 'soato', ${TABLE_NAMES.COUNTRIES}.soato) as country`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.REGIONS}.id, 'name', ${TABLE_NAMES.REGIONS}.name, 'soato', ${TABLE_NAMES.REGIONS}.soato) as region`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.DISTRICTS}.id, 'name', ${TABLE_NAMES.DISTRICTS}.name, 'soato', ${TABLE_NAMES.DISTRICTS}.soato) as district`),
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
        `${TABLE_NAMES.GROUP_MEMBERS}.group_id`,
        this.db.raw(`CASE WHEN grp.id IS NULL THEN NULL ELSE json_build_object('id', grp.id, 'name', grp.name, 'departure_date', grp.departure_date, 'return_date', grp.return_date, 'meeting_point', grp.meeting_point, 'status', grp.status, 'guide_name', NULLIF(TRIM(CONCAT_WS(' ', guide.first_name, guide.middle_name, guide.last_name)), ''), 'guide_phone', guide.phone) END as "group"`),
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

  /**
   * Shared WHERE for the paginated lists. Besides plain pilgrim columns it accepts
   * `has_group` (boolean): whether the pilgrim is already a member of any group,
   * `has_passport` (true): only pilgrims with a passport number or scan, and
   * `q`: part of the name, phone, PINFL or passport number.
   */
  private applyListFilters(builder: Knex.QueryBuilder, where: Partial<Pilgrim> & { has_group?: boolean; has_passport?: boolean; q?: string }) {
    Object.entries(where).forEach(([key, value]) => {
      if (key === 'is_deleted' || key === 'has_group' || key === 'has_passport' || key === 'q') return;
      builder.where(`${TABLE_NAMES.PILGRIMS}.${key}`, value);
    });
    builder.where(`${TABLE_NAMES.PILGRIMS}.is_deleted`, false);
    if (where.has_group !== undefined) {
      const members = this.db(TABLE_NAMES.GROUP_MEMBERS)
        .select(this.db.raw('1'))
        .whereRaw(`${TABLE_NAMES.GROUP_MEMBERS}.pilgrim_id = ${TABLE_NAMES.PILGRIMS}.id`);
      if (where.has_group) builder.whereExists(members);
      else builder.whereNotExists(members);
    }
    if (where.has_passport) {
      const P = TABLE_NAMES.PILGRIMS;
      builder.where((b) => {
        b.whereRaw(`NULLIF(TRIM(${P}.passport_number), '') IS NOT NULL`).orWhereNotNull(`${P}.passport_photo_path`);
      });
    }
    const q = where.q?.trim();
    if (q) {
      const P = TABLE_NAMES.PILGRIMS;
      const like = `%${q.replace(/[\\%_]/g, (c) => '\\' + c)}%`;
      const digits = q.replace(/\D/g, '');
      builder.where((b) => {
        b.whereRaw(`concat_ws(' ', ${P}.first_name, ${P}.middle_name, ${P}.last_name) ILIKE ?`, [like])
          .orWhereRaw(`concat_ws(' ', ${P}.last_name, ${P}.first_name) ILIKE ?`, [like])
          .orWhere(`${P}.passport_number`, 'ilike', like);
        if (digits.length >= 3) b.orWhere(`${P}.phone`, 'like', `%${digits}%`).orWhere(`${P}.pinfl`, 'like', `%${digits}%`);
      });
    }
  }

  async findManyPaginated(
    where: Partial<Pilgrim> & { has_group?: boolean; has_passport?: boolean; q?: string } = {},
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ) {
    const { PaginatedResult } = await import('../interfaces/pagination.interface');
    
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .where((builder) => this.applyListFilters(builder, where))
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
        this.db.raw(
          `(SELECT json_build_object('id', g.id, 'name', g.name) FROM ${TABLE_NAMES.GROUP_MEMBERS} gm
            JOIN ${TABLE_NAMES.GROUPS} g ON g.id = gm.group_id
            WHERE gm.pilgrim_id = ${TABLE_NAMES.PILGRIMS}.id LIMIT 1) as "group"`,
        ),
      )
      .where((builder) => this.applyListFilters(builder, where))
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .orderBy(`${TABLE_NAMES.PILGRIMS}.created_at`, 'desc')
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
    where: Partial<Pilgrim> & { has_group?: boolean; has_passport?: boolean; q?: string } = {},
    phone: string,
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ) {
    const { PaginatedResult } = await import('../interfaces/pagination.interface');
    
    const offset = (pageIndex - 1) * pageSize;

    const [{ count }] = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .where((builder) => this.applyListFilters(builder, where))
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
        this.db.raw(
          `(SELECT json_build_object('id', g.id, 'name', g.name) FROM ${TABLE_NAMES.GROUP_MEMBERS} gm
            JOIN ${TABLE_NAMES.GROUPS} g ON g.id = gm.group_id
            WHERE gm.pilgrim_id = ${TABLE_NAMES.PILGRIMS}.id LIMIT 1) as "group"`,
        ),
      )
      .where((builder) => this.applyListFilters(builder, where))
      .where(`${TABLE_NAMES.PILGRIMS}.phone`, 'ILIKE', `%${phone}%`)
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
      .orderBy(`${TABLE_NAMES.PILGRIMS}.created_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as Pilgrim[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  async findGuidesPaginatedWithGroupFilter(
    where: Partial<Pilgrim> = {},
    pageIndex: number = 1,
    pageSize: number = 10,
    hasGroup: boolean,
    trx?: Knex.Transaction,
  ) {
    const { PaginatedResult } = await import('../interfaces/pagination.interface');
    
    const offset = (pageIndex - 1) * pageSize;

    // Build base query for filters
    const buildFilteredQuery = () => {
      let baseQuery = this.qb(trx)
        .where((builder) => {
          Object.entries(where).forEach(([key, value]) => {
            if (key !== 'is_deleted') {
              builder.where(`${TABLE_NAMES.PILGRIMS}.${key}`, value);
            }
          });
          builder.where(`${TABLE_NAMES.PILGRIMS}.is_deleted`, false);
        })
        .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`);

      // Apply has_group filter
      if (hasGroup) {
        baseQuery = baseQuery
          .innerJoin(TABLE_NAMES.GROUPS, `${TABLE_NAMES.PILGRIMS}.id`, `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`)
          .where({ [`${TABLE_NAMES.GROUPS}.is_deleted`]: false })
          .whereNull(`${TABLE_NAMES.GROUPS}.deleted_at`);
      } else {
        // Deleted groups are matched in the join itself, so a guide whose only group was
        // deleted counts as free again.
        baseQuery = baseQuery
          .leftJoin(TABLE_NAMES.GROUPS, (join) => {
            join.on(`${TABLE_NAMES.PILGRIMS}.id`, '=', `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`)
              .andOn(`${TABLE_NAMES.GROUPS}.is_deleted`, '=', this.db.raw('false'))
              .andOnNull(`${TABLE_NAMES.GROUPS}.deleted_at`);
          })
          .whereNull(`${TABLE_NAMES.GROUPS}.id`);
      }

      return baseQuery;
    };

    // Get total count
    const [{ count }] = await buildFilteredQuery()
      .countDistinct(`${TABLE_NAMES.PILGRIMS}.id as count`);

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    // Create subquery to get distinct IDs with pagination
    const idsSubquery = buildFilteredQuery()
      .select(`${TABLE_NAMES.PILGRIMS}.id`, `${TABLE_NAMES.PILGRIMS}.created_at`)
      .distinct()
      .orderBy(`${TABLE_NAMES.PILGRIMS}.created_at`, 'desc')
      .limit(pageSize)
      .offset(offset)
      .as('pilgrim_ids');

    // Get full records with agency join
    const records = await this.qb(trx)
      .from(idsSubquery)
      .innerJoin(TABLE_NAMES.PILGRIMS, 'pilgrim_ids.id', `${TABLE_NAMES.PILGRIMS}.id`)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .orderBy(`${TABLE_NAMES.PILGRIMS}.created_at`, 'desc');

    return new PaginatedResult(records as Pilgrim[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  async searchByPhoneOrPinfl(
    search: string,
    pageIndex: number = 1,
    pageSize: number = 10,
    trx?: Knex.Transaction,
  ) {
    const { PaginatedResult } = await import('../interfaces/pagination.interface');

    const offset = (pageIndex - 1) * pageSize;
    const pattern = `%${search}%`;

    const applySearch = (builder: Knex.QueryBuilder) => {
      builder
        .where(`${TABLE_NAMES.PILGRIMS}.is_deleted`, false)
        .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`)
        .where((q) => {
          q.where(`${TABLE_NAMES.PILGRIMS}.phone`, 'ILIKE', pattern)
            .orWhere(`${TABLE_NAMES.PILGRIMS}.pinfl`, 'ILIKE', pattern);
        });
    };

    const [{ count }] = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .where((b) => applySearch(b))
      .count('* as count');

    const totalItemsCount = Number(count);
    const totalPagesCount = Math.ceil(totalItemsCount / pageSize);

    const records = await this.qb(trx)
      .leftJoin(TABLE_NAMES.AGENCIES, `${TABLE_NAMES.PILGRIMS}.agency_id`, `${TABLE_NAMES.AGENCIES}.id`)
      .select(
        `${TABLE_NAMES.PILGRIMS}.*`,
        this.db.raw(`json_build_object('id', ${TABLE_NAMES.AGENCIES}.id, 'name', ${TABLE_NAMES.AGENCIES}.name) as agency`),
      )
      .where((b) => applySearch(b))
      .orderBy(`${TABLE_NAMES.PILGRIMS}.created_at`, 'desc')
      .limit(pageSize)
      .offset(offset);

    return new PaginatedResult(records as Pilgrim[], {
      total_items_count: totalItemsCount,
      total_pages_count: totalPagesCount,
      page_size: pageSize,
      page_index: pageIndex,
    });
  }

  async findGuidesByAgency(agencyId: string, hasGroup?: boolean, trx?: Knex.Transaction): Promise<Pilgrim[]> {
    let query = this.qb(trx)
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
      .whereNull(`${TABLE_NAMES.PILGRIMS}.deleted_at`);

    // Apply has_group filter if provided
    if (hasGroup !== undefined) {
      if (hasGroup) {
        // Guides with at least one group
        query = query
          .innerJoin(TABLE_NAMES.GROUPS, `${TABLE_NAMES.PILGRIMS}.id`, `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`)
          .where({ [`${TABLE_NAMES.GROUPS}.is_deleted`]: false })
          .whereNull(`${TABLE_NAMES.GROUPS}.deleted_at`);
      } else {
        // Guides without any group
        query = query
          .leftJoin(TABLE_NAMES.GROUPS, `${TABLE_NAMES.PILGRIMS}.id`, `${TABLE_NAMES.GROUPS}.guide_pilgrim_id`)
          .whereNull(`${TABLE_NAMES.GROUPS}.id`);
      }
    }

    const records = await query
      .distinct(`${TABLE_NAMES.PILGRIMS}.id`)
      .orderBy(`${TABLE_NAMES.PILGRIMS}.first_name`);

    return records as Pilgrim[];
  }
}
