import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { DuasService } from './duas.service';
import { CreateDuaDto } from './dto/create-dua.dto';
import { UpdateDuaDto } from './dto/update-dua.dto';
import { PaginationDto } from 'src/shared/dto/pagination.dto';
import { IsPublic } from 'src/shared/decorators/is-public.decorator';

const ALLOWED_AUDIO = ['.mp3', '.m4a', '.wav', '.ogg', '.aac', '.webm'];

@Controller('references/duas')
export class DuasController {
  constructor(private readonly duasService: DuasService) {}

  @Post()
  async create(@Body() dto: CreateDuaDto) {
    return this.duasService.create(dto);
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
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/audio/${file.filename}` };
  }

  // ── CRUD ────────────────────────────────────────────────────

  @IsPublic()
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.duasService.findAllPaginated({}, pagination.page_index, pagination.page_size);
  }

  @IsPublic()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.duasService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDuaDto) {
    if ('audio_url' in dto) {
      const existing = await this.duasService.findOne(id);
      if (existing?.audio_url && existing.audio_url !== dto.audio_url) {
        this.duasService.deleteAudioFile(existing.audio_url);
      }
    }
    return this.duasService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const existing = await this.duasService.findOne(id);
    if (existing?.audio_url) this.duasService.deleteAudioFile(existing.audio_url);
    return this.duasService.remove(id);
  }
}
