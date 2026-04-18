import { Module, Global } from '@nestjs/common';
import { UsersDao } from './users.dao';
import { UsersService } from './users.service';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { AdminsDao } from 'src/shared/dao/admins.dao';

@Global()
@Module({
  providers: [
    UsersDao,
    UsersService,
    PilgrimsDao,
    AdminsDao,
    {
      provide: 'UsersService',
      useExisting: UsersService,
    },
  ],
  exports: [UsersDao, UsersService, 'UsersService'],
})
export class UsersModule { }
