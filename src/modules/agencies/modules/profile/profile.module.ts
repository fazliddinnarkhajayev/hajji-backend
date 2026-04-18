import { Module } from '@nestjs/common';
import { AgencyProfileService } from './profile.service';
import { AgencyProfileController } from './profile.controller';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { AgenciesDao } from 'src/modules/admins/modules/agencies/agencies.dao';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AgencyProfileController],
  providers: [AgencyProfileService, AgencyUsersDao, AgenciesDao],
  exports: [AgencyProfileService],
})
export class AgencyProfileModule {}
