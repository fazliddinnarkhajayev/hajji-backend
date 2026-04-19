import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { PilgrimAgencyHistoryDao } from "./dao/pilgrim-agency-history.dao";
import { InvitationsDao } from "./dao/invitations.dao";

@Module({
  imports: [JwtModule.register({})],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    PilgrimAgencyHistoryDao,
    InvitationsDao,
  ],
  exports: [JwtModule, PilgrimAgencyHistoryDao, InvitationsDao],
})
export class SharedModule {}
