import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../core/database/database.constants';
import { TABLE_NAMES } from '../constants/table-names';
import { BaseDao } from './base.dao';

import { InvitationStatus } from 'src/modules/agencies/modules/invitations/enums/invitation-status.enum';

export interface Invitation {
  id: string;
  pilgrim_id: string;
  agency_id: string;
  invited_by: string;
  status: InvitationStatus;
  message?: string | null;
  expires_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
  // Joined data
  pilgrim?: {
    id?: string;
    first_name?: string;
    last_name?: string | null;
  };
  agency?: {
    id?: string;
    name?: string;
  };
  user?: {
    id?: string;
    username?: string;
  };
}

@Injectable()
export class InvitationsDao extends BaseDao<Invitation> {
  constructor(@Inject(KNEX_CONNECTION) db: Knex) {
    super(TABLE_NAMES.INVITATIONS, db);
  }

  async createInvitation(
    data: Omit<Invitation, 'id' | 'created_at' | 'updated_at'>,
    trx?: Knex.Transaction,
  ): Promise<Invitation> {
    const [record] = await this.qb(trx).insert(data).returning('*');
    return record as Invitation;
  }

  async getInvitationById(
    id: string,
    trx?: Knex.Transaction,
  ): Promise<Invitation | undefined> {
    return this.findById(id, trx);
  }

  async getInvitationWithJoins(
    id: string,
    trx?: Knex.Transaction,
  ): Promise<Invitation | undefined> {
    const record = await this.qb(trx)
      .where({ id })
      .leftJoin(
        TABLE_NAMES.PILGRIMS,
        `${this.tableName}.pilgrim_id`,
        `${TABLE_NAMES.PILGRIMS}.id`,
      )
      .leftJoin(
        TABLE_NAMES.AGENCIES,
        `${this.tableName}.agency_id`,
        `${TABLE_NAMES.AGENCIES}.id`,
      )
      .leftJoin(
        TABLE_NAMES.USERS,
        `${this.tableName}.invited_by`,
        `${TABLE_NAMES.USERS}.id`,
      )
      .select(
        `${this.tableName}.*`,
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.PILGRIMS}"."id",
            'first_name', "${TABLE_NAMES.PILGRIMS}"."first_name",
            'last_name', "${TABLE_NAMES.PILGRIMS}"."last_name"
          ) as pilgrim
        `),
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.AGENCIES}"."id",
            'name', "${TABLE_NAMES.AGENCIES}"."name"
          ) as agency
        `),
        this.db.raw(`
          jsonb_build_object(
            'id', "${TABLE_NAMES.USERS}"."id",
            'username', "${TABLE_NAMES.USERS}"."username"
          ) as user
        `),
      )
      .first();

    return record as Invitation | undefined;
  }

  async getPendingInvitationsForPilgrim(
    pilgrimId: string,
    limit: number = 50,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<Invitation[]> {
    return this.qb(trx)
      .where({ pilgrim_id: pilgrimId, status: InvitationStatus.PENDING })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getPendingInvitationsForAgency(
    agencyId: string,
    limit: number = 50,
    offset: number = 0,
    trx?: Knex.Transaction,
  ): Promise<Invitation[]> {
    return this.qb(trx)
      .where({ agency_id: agencyId, status: InvitationStatus.PENDING })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  async getInvitationByPilgrimAndAgency(
    pilgrimId: string,
    agencyId: string,
    status?: InvitationStatus,
    trx?: Knex.Transaction,
  ): Promise<Invitation | undefined> {
    const query = this.qb(trx).where({ pilgrim_id: pilgrimId, agency_id: agencyId });
    if (status) {
      query.where({ status });
    }
    return query.first();
  }

  async updateInvitationStatus(
    id: string,
    status: InvitationStatus,
    trx?: Knex.Transaction,
  ): Promise<Invitation | undefined> {
    const [record] = await this.qb(trx)
      .where({ id })
      .update({ status, updated_at: new Date() })
      .returning('*');
    return record as Invitation | undefined;
  }

  async countPendingInvitations(
    pilgrimId: string,
    trx?: Knex.Transaction,
  ): Promise<number> {
    const result = await this.qb(trx)
      .where({ pilgrim_id: pilgrimId, status: InvitationStatus.PENDING })
      .count('* as count')
      .first();
    return result?.count || 0;
  }
}
