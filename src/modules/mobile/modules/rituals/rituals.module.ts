import { Module } from '@nestjs/common';
import { MobileRitualsController } from './rituals.controller';
import { MobileRitualsService } from './rituals.service';
import { RitualsModule } from 'src/modules/references/modules/rituals/rituals.module';

@Module({
  imports: [RitualsModule],
  controllers: [MobileRitualsController],
  providers: [MobileRitualsService],
})
export class MobileRitualsModule {}
