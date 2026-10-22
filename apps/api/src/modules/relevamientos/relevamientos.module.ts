import { Module } from '@nestjs/common';
import { RelevamientoFilesController, RelevamientosController } from './relevamientos.controller';
import { RelevamientosService } from './relevamientos.service';

@Module({
  controllers: [RelevamientosController, RelevamientoFilesController],
  providers: [RelevamientosService],
  exports: [RelevamientosService],
})
export class RelevamientosModule {}
