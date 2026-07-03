import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatDao } from './chat.dao';
import { WebSocketModule } from 'src/modules/websocket/websocket.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';

@Module({
  imports: [WebSocketModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatDao],
})
export class ChatModule {}
