import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CoreModule } from 'src/core/core.module';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [CoreModule, JwtModule.register({})],
  controllers: [ProfileController],
  providers: [PilgrimsDao, ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}

