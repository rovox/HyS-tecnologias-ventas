import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SucursalesController } from './sucursales.controller';

@Module({
  imports: [AuthModule],
  controllers: [SucursalesController],
})
export class SucursalesModule {}
