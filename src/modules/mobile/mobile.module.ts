import { Module } from '@nestjs/common';
import { MobileModulesModule } from './modules/modules.module';

@Module({
  imports: [MobileModulesModule],
})
export class MobileModule {}
