import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SessionsController } from './sessions.controller';
import { UsersController } from './users.controller';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthService } from './auth.service';
import { ActivityService } from './activity.service';

@Module({
  controllers: [AuthController, SessionsController, UsersController],
  providers: [AuthService, AuthGuard, RolesGuard, ActivityService],
  exports: [AuthGuard, RolesGuard, ActivityService],
})
export class AuthModule {}
