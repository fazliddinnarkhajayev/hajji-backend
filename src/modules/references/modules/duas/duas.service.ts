import { Injectable } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { DuasDao, Dua } from './duas.dao';
import { BaseService } from 'src/shared/services/base.service';

@Injectable()
export class DuasService extends BaseService<Dua, DuasDao> {
  constructor(private readonly duasDao: DuasDao) {
    super(duasDao);
  }

  deleteAudioFile(audioUrl: string): void {
    if (!audioUrl?.startsWith('/uploads/')) return;
    const filePath = join(process.cwd(), audioUrl);
    if (existsSync(filePath)) {
      try { unlinkSync(filePath); } catch { /* ignore */ }
    }
  }
}
