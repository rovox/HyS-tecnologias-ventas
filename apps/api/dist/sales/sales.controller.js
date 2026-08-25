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
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const roles_1 = require("../auth/roles");
const roles_guard_1 = require("../auth/roles.guard");
const sales_dto_1 = require("./dto/sales.dto");
const sales_service_1 = require("./sales.service");
let SalesController = class SalesController {
    sales;
    constructor(sales) {
        this.sales = sales;
    }
    list(user) {
        return this.sales.list(user);
    }
    get(id, user) {
        return this.sales.get(id, user);
    }
    addJob(id, dto, user, sessionId) {
        return this.sales.addJob(id, dto, user, sessionId);
    }
    updateJob(id, jobId, dto, user, sessionId) {
        return this.sales.updateJob(id, jobId, dto.estado, user, sessionId);
    }
    addPayment(id, dto, user, sessionId) {
        return this.sales.addPayment(id, dto, user, sessionId);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List sales (frozen domain — read)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sale by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(':id/jobs'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Add job (admin only; domain frozen)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_dto_1.CreateJobDto, Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "addJob", null);
__decorate([
    (0, common_1.Patch)(':id/jobs/:jobId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update job status (admin only; domain frozen)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __param(4, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, sales_dto_1.JobStatusDto, Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "updateJob", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Add payment (admin only; domain frozen)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sales_dto_1.CreatePaymentDto, Object, String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "addPayment", null);
exports.SalesController = SalesController = __decorate([
    (0, swagger_1.ApiTags)('sales'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('sales'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map