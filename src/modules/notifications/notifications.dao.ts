import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/core/database/database.constants';
import { TABLE_NAMES } from 'src/shared/constants';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string | null;
  // The entity name (task title, group name, pilgrim name...) kept apart from
  // `message` so clients can build a fully localized sentence via a per-type
  // i18n template instead of showing message's baked-in English phrasing.
  subject?: string | null;
  link_screen?: string | null;
  link_id?: string | null;
  is_read: boolean;
  created_at: Date;
}

export interface NotifyLink {
  screen: string;
  id?: string;
}

export interface NotifyOptions {
  message?: string;
  subject?: string;
  link?: NotifyLink;
}

@Injectable()
export class NotificationsDao {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async insert(userId: string, type: string, title: string, opts: NotifyOptions = {}): Promise<Notification> {
    const [row] = await this.db(TABLE_NAMES.NOTIFICATIONS)
      .insert({
        user_id: userId,
        type,
        title,
        message: opts.message ?? null,
        subject: opts.subject ?? null,
        link_screen: opts.link?.screen ?? null,
        link_id: opts.link?.id ?? null,
      })
      .returning('*');
    return row as Notification;
  }

  async findByUser(userId: string, pageIndex = 1, pageSize = 20): Promise<{ data: Notification[]; total: number }> {
    const base = this.db(TABLE_NAMES.NOTIFICATIONS).where({ user_id: userId });

    const [{ count }] = await base.clone().count('* as count');
    const data = await base.clone()
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset((pageIndex - 1) * pageSize);

    return { data: data as Notification[], total: Number(count) };
  }

  async countUnread(userId: string): Promise<number> {
    const [{ count }] = await this.db(TABLE_NAMES.NOTIFICATIONS)
      .where({ user_id: userId, is_read: false })
      .count('* as count');
    return Number(count);
  }

  async markRead(id: string, userId: string): Promise<void> {
    await this.db(TABLE_NAMES.NOTIFICATIONS)
      .where({ id, user_id: userId })
      .update({ is_read: true });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db(TABLE_NAMES.NOTIFICATIONS)
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true });
  }
}
