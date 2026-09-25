import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsDao } from './notifications.dao';
import { WebSocketModule } from 'src/modules/websocket/websocket.module';

@Module({
  imports: [WebSocketModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsDao],
  exports: [NotificationsService],
})
export class NotificationsModule {}
