import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { IncomeService } from './income.service';
import { LedgerService } from './ledger.service';

@Module({
  controllers: [FinanceController],
  providers: [LedgerService, IncomeService],
  exports: [IncomeService],
})
export class FinanceModule {}
