import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RelevamientosController } from './relevamientos.controller';
import { RelevamientosService } from './relevamientos.service';

@Module({
  imports: [AuthModule],
  controllers: [RelevamientosController],
  providers: [RelevamientosService],
})
export class RelevamientosModule {}
