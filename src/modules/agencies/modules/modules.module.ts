import { Module } from '@nestjs/common';
import { AgencyProfileModule } from './profile/profile.module';
import { AgencyPilgrimsModule } from './pilgrims/pilgrims.module';

@Module({
  imports: [AgencyProfileModule, AgencyPilgrimsModule],
})
export class AgencyModulesModule {}
