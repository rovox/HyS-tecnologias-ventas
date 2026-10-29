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
exports.DirectSalesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const direct_sale_dto_1 = require("./dto/direct-sale.dto");
const direct_sales_service_1 = require("./direct-sales.service");
let DirectSalesController = class DirectSalesController {
    sales;
    constructor(sales) {
        this.sales = sales;
    }
    list(query, user) {
        return this.sales.list(query, user);
    }
    async note(id, original, user) {
        const { bytes, name } = await this.sales.note(id, user, original === '1');
        return new common_1.StreamableFile(bytes, { type: 'application/pdf', disposition: `inline; filename="${name}"` });
    }
    get(id, user) {
        return this.sales.get(id, user);
    }
    create(dto, user, sessionId) {
        return this.sales.create(dto, user, sessionId);
    }
    annul(id, dto, user, sessionId) {
        return this.sales.annul(id, dto, user, sessionId);
    }
};
exports.DirectSalesController = DirectSalesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Direct sales (branch, days, seller, state)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [direct_sale_dto_1.ListDirectSalesQuery, Object]),
    __metadata("design:returntype", void 0)
], DirectSalesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id/nota.pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'The stored sale note (the ANULADA copy of an annulled sale; ?original=1 for the first one)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('original')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], DirectSalesController.prototype, "note", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'One direct sale with its lines and payments' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DirectSalesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Sell: stock leaves the branch and the payments are validated into the box of their method' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [direct_sale_dto_1.CreateDirectSaleDto, Object, String]),
    __metadata("design:returntype", void 0)
], DirectSalesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/anular'),
    (0, swagger_1.ApiOperation)({ summary: 'Annul with a reason (Administración, Contabilidad): stock comes back, payments are annulled' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, direct_sale_dto_1.AnnulDirectSaleDto, Object, String]),
    __metadata("design:returntype", void 0)
], DirectSalesController.prototype, "annul", null);
exports.DirectSalesController = DirectSalesController = __decorate([
    (0, swagger_1.ApiTags)('direct-sales'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('direct-sales'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [direct_sales_service_1.DirectSalesService])
], DirectSalesController);
//# sourceMappingURL=direct-sales.controller.js.map