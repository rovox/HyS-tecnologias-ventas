import { Module } from '@nestjs/common';
import { FinanceModule } from '../finance';
import { RelevamientoFilesController, RelevamientosController } from './relevamientos.controller';
import { RelevamientosService } from './relevamientos.service';

@Module({
  imports: [FinanceModule],
  controllers: [RelevamientosController, RelevamientoFilesController],
  providers: [RelevamientosService],
  exports: [RelevamientosService],
})
export class RelevamientosModule {}
