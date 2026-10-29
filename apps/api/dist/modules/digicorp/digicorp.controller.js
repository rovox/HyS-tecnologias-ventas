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
exports.DigicorpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const digicorp_dto_1 = require("./dto/digicorp.dto");
const digicorp_service_1 = require("./digicorp.service");
let DigicorpController = class DigicorpController {
    digicorp;
    constructor(digicorp) {
        this.digicorp = digicorp;
    }
    list(query, user) {
        return this.digicorp.list(query, user);
    }
    detail(sku, user) {
        return this.digicorp.detail(sku, user);
    }
    sync(user) {
        return this.digicorp.startSync(user);
    }
};
exports.DigicorpController = DigicorpController;
__decorate([
    (0, common_1.Get)('productos'),
    (0, swagger_1.ApiOperation)({ summary: "Digicorp's public catalog (search, brand), with the last sync" }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [digicorp_dto_1.ListDigicorpQuery, Object]),
    __metadata("design:returntype", void 0)
], DigicorpController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('productos/:sku'),
    (0, swagger_1.ApiOperation)({ summary: 'One product; its detail is refreshed on demand after 30 days' }),
    __param(0, (0, common_1.Param)('sku')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DigicorpController.prototype, "detail", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh the catalog now (Administración, Contabilidad); runs in the background' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], DigicorpController.prototype, "sync", null);
exports.DigicorpController = DigicorpController = __decorate([
    (0, swagger_1.ApiTags)('digicorp'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('digicorp'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [digicorp_service_1.DigicorpService])
], DigicorpController);
//# sourceMappingURL=digicorp.controller.js.map