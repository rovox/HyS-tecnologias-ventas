import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { CashCloseService } from './cash-close.service';
import { IncomeService } from './income.service';
import { LedgerService } from './ledger.service';

@Module({
  controllers: [FinanceController],
  providers: [LedgerService, IncomeService, CashCloseService],
  exports: [IncomeService],
})
export class FinanceModule {}
