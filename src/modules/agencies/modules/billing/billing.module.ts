import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AgencyBillingController } from './billing.controller';
import { AgencyBillingService } from './billing.service';

@Module({
  imports: [SharedModule],
  providers: [AgencyBillingService],
  controllers: [AgencyBillingController],
})
export class AgencyBillingModule {}
