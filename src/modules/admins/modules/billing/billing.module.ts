import { Module } from '@nestjs/common';
import { SharedModule } from 'src/shared/shared.module';
import { AdminBillingController } from './billing.controller';
import { AdminBillingService } from './billing.service';

@Module({
  imports: [SharedModule],
  providers: [AdminBillingService],
  controllers: [AdminBillingController],
})
export class AdminBillingModule {}
