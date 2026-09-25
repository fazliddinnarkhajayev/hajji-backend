import { Module } from '@nestjs/common';
import { MobileDuasController } from './duas.controller';
import { MobileDuasService } from './duas.service';
import { DuasModule } from 'src/modules/references/modules/duas/duas.module';

@Module({
  imports: [DuasModule],
  controllers: [MobileDuasController],
  providers: [MobileDuasService],
})
export class MobileDuasModule {}
