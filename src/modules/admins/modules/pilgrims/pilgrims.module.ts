import { Module } from '@nestjs/common';
import { PilgrimsService } from './pilgrims.service';
import { PilgrimsController } from './pilgrims.controller';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { PilgrimAgencyHistoryDao } from 'src/shared/dao/pilgrim-agency-history.dao';
import { PilgrimDeleteRequestDao } from 'src/shared/dao/pilgrim-delete-request.dao';
import { UsersModule } from 'src/modules/users/users.module';
import { SundryService } from 'src/shared/services/sundry.service';

@Module({
  imports: [UsersModule],
  providers: [PilgrimsService, PilgrimsDao, PilgrimAgencyHistoryDao, PilgrimDeleteRequestDao, SundryService],
  controllers: [PilgrimsController],
})
export class PilgrimsModule {}
