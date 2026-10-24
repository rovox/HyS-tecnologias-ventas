import { Module } from '@nestjs/common';
import { PedidosInternosController } from './pedidos-internos.controller';
import { PedidosInternosService } from './pedidos-internos.service';
import { InventoryModule } from '../inventory';

@Module({
  imports: [InventoryModule],
  controllers: [PedidosInternosController],
  providers: [PedidosInternosService],
  exports: [PedidosInternosService],
})
export class PedidosInternosModule {}
