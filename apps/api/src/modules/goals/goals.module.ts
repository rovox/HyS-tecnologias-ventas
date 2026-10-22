import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime/realtime.module';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [GoalsController],
  providers: [GoalsService],
})
export class GoalsModule {}
