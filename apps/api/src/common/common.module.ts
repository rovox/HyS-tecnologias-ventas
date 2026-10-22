import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { RealtimeService } from './realtime/realtime.service';
import { RealtimeController } from './realtime/realtime.controller';
import { AuditService } from './audit/audit.service';
import { AuthGuard } from './auth/auth.guard';
import { RolesGuard } from './auth/roles.guard';

/** Shared kernel, available to every module without importing it: database, audit + realtime, guards. */
@Global()
@Module({
  controllers: [RealtimeController],
  providers: [PrismaService, RealtimeService, AuditService, AuthGuard, RolesGuard],
  exports: [PrismaService, RealtimeService, AuditService, AuthGuard, RolesGuard],
})
export class CommonModule {}
