import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { RelevamientoFilesController, RelevamientosController } from './relevamientos.controller';
import { RelevamientosService } from './relevamientos.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [RelevamientosController, RelevamientoFilesController],
  providers: [RelevamientosService],
  exports: [RelevamientosService],
})
export class RelevamientosModule {}
