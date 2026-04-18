import { Module } from '@nestjs/common';
import { AgencyPilgrimsService } from './pilgrims.service';
import { AgencyPilgrimsController } from './pilgrims.controller';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AgencyPilgrimsController],
  providers: [AgencyPilgrimsService, PilgrimsDao, AgencyUsersDao],
  exports: [AgencyPilgrimsService],
})
export class AgencyPilgrimsModule {}
