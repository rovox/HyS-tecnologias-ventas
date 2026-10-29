"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const finance_dto_1 = require("./dto/finance.dto");
const ledger_service_1 = require("./ledger.service");
const cash_close_service_1 = require("./cash-close.service");
const cash_close_dto_1 = require("./dto/cash-close.dto");
let FinanceController = class FinanceController {
    ledger;
    cashClose;
    constructor(ledger, cashClose) {
        this.ledger = ledger;
        this.cashClose = cashClose;
    }
    closePreview(query, user) {
        return this.cashClose.preview(query.sucursalId, query.dia, user);
    }
    closes(query, user) {
        return this.cashClose.list(query, user);
    }
    close(dto, user, sessionId) {
        return this.cashClose.close(dto, user, sessionId);
    }
    approveClose(id, user, sessionId) {
        return this.cashClose.review(id, 'aprobar', undefined, user, sessionId);
    }
    observeClose(id, dto, user, sessionId) {
        return this.cashClose.review(id, 'observar', dto.motivo, user, sessionId);
    }
    list(query, user) {
        return this.ledger.list(query, user);
    }
    async export(query, user) {
        const { file, name, type } = await this.ledger.export(query, user);
        return new common_1.StreamableFile(file, { type, disposition: `attachment; filename="${name}"` });
    }
    summary(mes, user) {
        return this.ledger.summary(user, mes);
    }
    advances(user) {
        return this.ledger.advances(user);
    }
    settle(id, dto, user, sessionId) {
        return this.ledger.settleAdvance(id, dto.nota, user, sessionId);
    }
    custody(user) {
        return this.ledger.custody(user);
    }
    get(id, user) {
        return this.ledger.get(id, user);
    }
    impact(id, query, user) {
        return this.ledger.impact(id, query, user);
    }
    create(dto, user, sessionId) {
        return this.ledger.create(dto, user, sessionId);
    }
    update(id, dto, user, sessionId) {
        return this.ledger.update(id, dto, user, sessionId);
    }
    validate(id, dto, user, sessionId) {
        return this.ledger.transition(id, 'validado', { cajaId: dto.cajaId }, user, sessionId);
    }
    observe(id, dto, user, sessionId) {
        return this.ledger.transition(id, 'observado', { motivo: dto.motivo }, user, sessionId);
    }
    cancel(id, dto, user, sessionId) {
        return this.ledger.transition(id, 'anulado', { motivo: dto.motivo }, user, sessionId);
    }
    refund(id, user, sessionId) {
        return this.ledger.refund(id, user, sessionId);
    }
    cashBoxes(user) {
        return this.ledger.cashBoxes(user);
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('cierres/preview'),
    (0, swagger_1.ApiOperation)({ summary: 'The day of a branch before counting: opening cash, cash movements, expected cash' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cash_close_dto_1.CashCloseQuery, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "closePreview", null);
__decorate([
    (0, common_1.Get)('cierres'),
    (0, swagger_1.ApiOperation)({ summary: 'Daily cash closes (branch, days)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cash_close_dto_1.ListCashClosesQuery, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "closes", null);
__decorate([
    (0, common_1.Post)('cierres'),
    (0, swagger_1.ApiOperation)({ summary: 'Close the cash of a branch for a day (count by denomination; a difference needs a reason)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cash_close_dto_1.CloseCashDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "close", null);
__decorate([
    (0, common_1.Post)('cierres/:id/aprobar'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve a close; its difference is validated into the branch box (Administración, Contabilidad)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "approveClose", null);
__decorate([
    (0, common_1.Post)('cierres/:id/observar'),
    (0, swagger_1.ApiOperation)({ summary: 'Observe a close with a reason; its difference is observed too (Administración, Contabilidad)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.ReasonDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "observeClose", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, swagger_1.ApiOperation)({ summary: 'Ledger (commercial roles see all, técnico his own)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ListMovementsQuery, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('movements/export'),
    (0, swagger_1.ApiOperation)({ summary: 'The ledger (day, range, branch or company) as CSV or Excel' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.ExportMovementsQuery, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "export", null);
__decorate([
    (0, common_1.Get)('resumen'),
    (0, swagger_1.ApiOperation)({ summary: 'Dashboard money: month cobrado / en caja / expenses, box balances, today per branch' }),
    __param(0, (0, common_1.Query)('mes')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('anticipos'),
    (0, swagger_1.ApiOperation)({ summary: 'Advances still to be accounted for, with days late' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "advances", null);
__decorate([
    (0, common_1.Post)('movements/:id/rendido'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an advance as accounted for (Administración, Contabilidad)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.SettleAdvanceDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "settle", null);
__decorate([
    (0, common_1.Get)('por-rendir'),
    (0, swagger_1.ApiOperation)({ summary: 'Money not yet validated, per person who holds it' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "custody", null);
__decorate([
    (0, common_1.Get)('movements/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'One movement' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('movements/:id/impacto'),
    (0, swagger_1.ApiOperation)({ summary: 'What validating or annulling it changes (boxes, balance owed, cost)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.ImpactQuery, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "impact", null);
__decorate([
    (0, common_1.Post)('movements'),
    (0, swagger_1.ApiOperation)({ summary: 'Register an expense, another income or a transfer (project/job payments go through them)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateMovementDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('movements/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Correct a movement: its author while it waits; Gerencia or Contabilidad always (history keeps every change)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.UpdateMovementDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "update", null);
__decorate([
    (0, common_1.Post)('movements/:id/validar'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate into a cash box (Gerencia, Contabilidad)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.ValidateMovementDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "validate", null);
__decorate([
    (0, common_1.Post)('movements/:id/observar'),
    (0, swagger_1.ApiOperation)({ summary: 'Send back with a reason (Gerencia, Contabilidad)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.ReasonDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "observe", null);
__decorate([
    (0, common_1.Post)('movements/:id/anular'),
    (0, swagger_1.ApiOperation)({ summary: 'Annul with a reason (a validated one leaves its box: Gerencia, Contabilidad)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, finance_dto_1.ReasonDto, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)('movements/:id/reembolsar'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark an employee expense as refunded (Gerencia, Contabilidad)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "refund", null);
__decorate([
    (0, common_1.Get)('cajas'),
    (0, swagger_1.ApiOperation)({ summary: 'Cash boxes with their validated balance' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "cashBoxes", null);
exports.FinanceController = FinanceController = __decorate([
    (0, swagger_1.ApiTags)('finance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [ledger_service_1.LedgerService,
        cash_close_service_1.CashCloseService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map