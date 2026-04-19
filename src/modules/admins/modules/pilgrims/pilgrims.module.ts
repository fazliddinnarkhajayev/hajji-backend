import { Module } from '@nestjs/common';
import { PilgrimsService } from './pilgrims.service';
import { PilgrimsController } from './pilgrims.controller';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { PilgrimAgencyHistoryDao } from 'src/shared/dao/pilgrim-agency-history.dao';
import { UsersModule } from 'src/modules/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [PilgrimsService, PilgrimsDao, PilgrimAgencyHistoryDao],
  controllers: [PilgrimsController],
})
export class PilgrimsModule {}
