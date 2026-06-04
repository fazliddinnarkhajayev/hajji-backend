import { Module } from '@nestjs/common';
import { AgencyUsersManagementController } from './users.controller';
import { AgencyUsersManagementService } from './users.service';
import { AgencyUsersDao } from 'src/modules/admins/modules/agencies/modules/agency-users/agency-users.dao';
import { UsersModule } from 'src/modules/users/users.module';
import { SundryService } from 'src/shared/services/sundry.service';

@Module({
  imports: [UsersModule],
  controllers: [AgencyUsersManagementController],
  providers: [AgencyUsersManagementService, AgencyUsersDao, SundryService],
})
export class AgencyUsersManagementModule {}
