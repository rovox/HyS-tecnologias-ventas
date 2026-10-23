// Public API of the finance module: the only file other modules (and app.module) may import.
export { FinanceModule } from './finance.module';
export { IncomeService } from './income.service';
export { balanceOf, expensesOf, incomeOf } from './domain/finance.rules';
