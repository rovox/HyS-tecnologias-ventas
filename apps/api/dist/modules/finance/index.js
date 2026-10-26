"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeOf = exports.expensesOf = exports.balanceOf = exports.IncomeService = exports.FinanceModule = void 0;
var finance_module_1 = require("./finance.module");
Object.defineProperty(exports, "FinanceModule", { enumerable: true, get: function () { return finance_module_1.FinanceModule; } });
var income_service_1 = require("./income.service");
Object.defineProperty(exports, "IncomeService", { enumerable: true, get: function () { return income_service_1.IncomeService; } });
var finance_rules_1 = require("./domain/finance.rules");
Object.defineProperty(exports, "balanceOf", { enumerable: true, get: function () { return finance_rules_1.balanceOf; } });
Object.defineProperty(exports, "expensesOf", { enumerable: true, get: function () { return finance_rules_1.expensesOf; } });
Object.defineProperty(exports, "incomeOf", { enumerable: true, get: function () { return finance_rules_1.incomeOf; } });
//# sourceMappingURL=index.js.map