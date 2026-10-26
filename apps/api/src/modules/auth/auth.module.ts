import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ActivityController } from './activity.controller';
import { SessionsController } from './sessions.controller';
import { UsersController } from './users.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController, ActivityController, SessionsController, UsersController],
  providers: [AuthService],
})
export class AuthModule {}
