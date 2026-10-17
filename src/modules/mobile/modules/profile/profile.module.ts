import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CoreModule } from 'src/core/core.module';
import { PilgrimsDao } from 'src/shared/dao/piligrims.dao';
import { PilgrimDeleteRequestDao } from 'src/shared/dao/pilgrim-delete-request.dao';
import { GroupVoiceKeysDao } from 'src/shared/dao/group-voice-keys.dao';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [CoreModule, JwtModule.register({})],
  controllers: [ProfileController],
  providers: [PilgrimsDao, PilgrimDeleteRequestDao, GroupVoiceKeysDao, ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}

