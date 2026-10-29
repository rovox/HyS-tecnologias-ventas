"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const finance_controller_1 = require("./finance.controller");
const cash_close_service_1 = require("./cash-close.service");
const income_service_1 = require("./income.service");
const ledger_service_1 = require("./ledger.service");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        controllers: [finance_controller_1.FinanceController],
        providers: [ledger_service_1.LedgerService, income_service_1.IncomeService, cash_close_service_1.CashCloseService],
        exports: [income_service_1.IncomeService],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map