import { Injectable } from '@nestjs/common';
import { NotificationsDao, NotifyOptions } from './notifications.dao';
import { WebSocketService } from 'src/modules/websocket/websocket.service';
import { PaginatedResult } from 'src/shared/interfaces/pagination.interface';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsDao: NotificationsDao,
    private readonly webSocketService: WebSocketService,
  ) {}

  // Persist + push in one call. Existing feature-specific socket events (e.g.
  // task_created, group_created) are unchanged and keep firing separately —
  // this only adds a persisted row plus a generic 'notification' push so the
  // notification bell/center doesn't need to know every business event name.
  // userId must be the core users.id, not agency_users.id/pilgrims.id.
  // opts.subject should be just the entity name (task title, group name, ...) —
  // clients build the localized sentence from type + subject via an i18n
  // template; opts.message (the pre-formatted English sentence) is kept only
  // as a fallback for older clients.
  async notify(userId: string, type: string, title: string, opts: NotifyOptions = {}) {
    const row = await this.notificationsDao.insert(userId, type, title, opts);
    this.webSocketService.broadcastToUser(userId, 'notification', row);
    return row;
  }

  async list(userId: string, page = 1, size = 20) {
    const { data, total } = await this.notificationsDao.findByUser(userId, page, size);
    return new PaginatedResult(data, {
      total_items_count: total,
      total_pages_count: Math.ceil(total / size) || 1,
      page_size: size,
      page_index: page,
    });
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    return { count: await this.notificationsDao.countUnread(userId) };
  }

  async markRead(id: string, userId: string): Promise<{ success: boolean }> {
    await this.notificationsDao.markRead(id, userId);
    return { success: true };
  }

  async markAllRead(userId: string): Promise<{ success: boolean }> {
    await this.notificationsDao.markAllRead(userId);
    return { success: true };
  }
}
