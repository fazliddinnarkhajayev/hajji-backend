import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { RitualsService } from './rituals.service';
import { CreateRitualDto } from './dto/create-ritual.dto';
import { UpdateRitualDto } from './dto/update-ritual.dto';
import { FindRitualsQueryDto } from './dto/find-rituals-query.dto';
import { IsPublic } from 'src/shared/decorators/is-public.decorator';

const ALLOWED_AUDIO = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.webm'];

@Controller('references/rituals')
export class RitualsController {
  constructor(private readonly ritualsService: RitualsService) {}

  @Post()
  async create(@Body() dto: CreateRitualDto) {
    return this.ritualsService.createWithTranslations(dto);
  }

  // ── Upload — must be before :id routes ──────────────────────
  @Post('upload/audio')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'audio'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (ALLOWED_AUDIO.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported format. Allowed: ${ALLOWED_AUDIO.join(', ')}`), false);
        }
      },
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async uploadAudio(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/audio/${file.filename}` };
  }

  // ── CRUD ────────────────────────────────────────────────────

  @IsPublic()
  @Get()
  async findAll(@Query() query: FindRitualsQueryDto) {
    return this.ritualsService.findAllPaginatedWithTranslations(
      query.page_index ?? 1,
      query.page_size ?? 10,
      query.type,
    );
  }

  @IsPublic()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ritualsService.findOneWithTranslations(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRitualDto) {
    if ('audio_url' in dto) {
      const existing = await this.ritualsService.findOne(id);
      if (existing?.audio_url && existing.audio_url !== dto.audio_url) {
        this.ritualsService.deleteAudioFile(existing.audio_url);
      }
    }
    return this.ritualsService.updateWithTranslations(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await this.ritualsService.findOne(id);
    if (existing?.audio_url) this.ritualsService.deleteAudioFile(existing.audio_url);
    return this.ritualsService.remove(id);
  }
}
