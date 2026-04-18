import { Module } from '@nestjs/common';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { AgencyModulesModule } from './modules/modules.module';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule, AgencyModulesModule],
  controllers: [AgenciesController],
  providers: [AgenciesService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
