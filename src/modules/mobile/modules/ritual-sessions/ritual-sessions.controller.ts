import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser } from 'src/shared/decorators';
import { SyncRitualSessionsDto } from './dto/sync-ritual-sessions.dto';
import { MobileRitualSessionsService } from './ritual-sessions.service';

@Controller('mobile/ritual-sessions')
export class MobileRitualSessionsController {
  constructor(private readonly service: MobileRitualSessionsService) {}

  /**
   * Tawaf / Sa'y runs recorded offline by the app — in progress or finished.
   * Each upload continues the run with the same client_id (summary replaced,
   * new GPS points appended); retries are safe.
   */
  @Post('sync')
  sync(@Body() dto: SyncRitualSessionsDto, @CurrentUser() user: any) {
    return this.service.sync(user.user_id, dto.sessions);
  }
}
