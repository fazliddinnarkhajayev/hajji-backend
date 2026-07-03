import { Body, Controller, Get, Param, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { ChatService } from './chat.service';
import { CurrentUser } from 'src/shared/decorators';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateRoomDto } from './dto/create-room.dto';

const ALLOWED_ATTACHMENTS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms')
  listRooms(@CurrentUser() user: any) {
    return this.chatService.listRooms(user.user_id, user.agency_id);
  }

  @Post('rooms')
  createRoom(@CurrentUser() user: any, @Body() dto: CreateRoomDto) {
    return this.chatService.createRoom(user.user_id, user.agency_id, dto);
  }

  @Get('rooms/:id/messages')
  getMessages(
    @CurrentUser() user: any,
    @Param('id') roomId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(roomId, user.user_id, user.agency_id, before, limit ? Number(limit) : undefined);
  }

  @Post('rooms/:id/messages')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'chat'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        cb(null, ALLOWED_ATTACHMENTS.includes(ext));
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  sendMessage(
    @CurrentUser() user: any,
    @Param('id') roomId: string,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: any,
  ) {
    const fileInfo = file
      ? { url: `/uploads/chat/${file.filename}`, name: file.originalname, size: String(file.size) }
      : undefined;
    return this.chatService.sendMessage(roomId, user.user_id, user.agency_id, dto, fileInfo);
  }

  @Patch('rooms/:id/read')
  markRead(@CurrentUser() user: any, @Param('id') roomId: string) {
    return this.chatService.markRead(roomId, user.user_id, user.agency_id);
  }
}
