import { Module } from '@nestjs/common';
import { DirectSalesController } from './direct-sales.controller';
import { DirectSalesService } from './direct-sales.service';

@Module({
  controllers: [DirectSalesController],
  providers: [DirectSalesService],
})
export class DirectSalesModule {}
