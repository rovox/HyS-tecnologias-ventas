import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../../common/realtime/realtime.module';
import { PedidosInternosController } from './pedidos-internos.controller';
import { PedidosInternosService } from './pedidos-internos.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [PedidosInternosController],
  providers: [PedidosInternosService],
  exports: [PedidosInternosService],
})
export class PedidosInternosModule {}
