import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from 'src/shared/decorators';
import { PaginationDto } from 'src/shared/dto/pagination.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  list(@Query() query: PaginationDto, @CurrentUser() user: any) {
    return this.service.list(user.user_id, query.page_index, query.page_size);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: any) {
    return this.service.unreadCount(user.user_id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: any) {
    return this.service.markAllRead(user.user_id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markRead(id, user.user_id);
  }
}
