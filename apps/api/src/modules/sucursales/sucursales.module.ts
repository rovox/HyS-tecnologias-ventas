import { Module } from '@nestjs/common';
import { SucursalesController } from './sucursales.controller';

@Module({
  controllers: [SucursalesController],
})
export class SucursalesModule {}
