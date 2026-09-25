import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PilgrimAgencyHistoryDao } from "./dao/pilgrim-agency-history.dao";
import { InvitationsDao } from "./dao/invitations.dao";
import { PilgrimsDao } from "./dao/piligrims.dao";
import { GroupsDao } from "./dao/groups.dao";
import { GroupMembersDao } from "./dao/group-members.dao";
import { UsersAuthDao } from "./dao/users-auth.dao";
import { SundryService } from "./services/sundry.service";
import { SmsService } from "./services/sms.service";

@Module({
  imports: [JwtModule.register({})],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    SundryService,
    SmsService,
    PilgrimAgencyHistoryDao,
    InvitationsDao,
    PilgrimsDao,
    GroupsDao,
    GroupMembersDao,
    UsersAuthDao,
  ],
  exports: [JwtModule, SundryService, SmsService, PilgrimAgencyHistoryDao, InvitationsDao, PilgrimsDao, GroupsDao, GroupMembersDao, UsersAuthDao],
})
export class SharedModule {}
