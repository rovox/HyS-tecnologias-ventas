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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const inventory_dto_1 = require("./dto/inventory.dto");
const inventory_service_1 = require("./inventory.service");
let InventoryController = class InventoryController {
    inventory;
    constructor(inventory) {
        this.inventory = inventory;
    }
    products(user) {
        return this.inventory.products(user);
    }
    create(dto, user, sessionId) {
        return this.inventory.createProduct(dto, user, sessionId);
    }
    update(id, dto, user, sessionId) {
        return this.inventory.updateProduct(id, dto, user, sessionId);
    }
    kardex(id, sucursalId, user) {
        return this.inventory.kardex(id, user, sucursalId);
    }
    movements(query, user) {
        return this.inventory.movements(user, query);
    }
    batch(dto, user, sessionId) {
        return this.inventory.registerBatch(dto, user, sessionId);
    }
    move(dto, user, sessionId) {
        return this.inventory.registerMovement(dto, user, sessionId);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'Catalog with stock per branch (computed from movements) and low-stock flag' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "products", null);
__decorate([
    (0, common_1.Post)('products'),
    (0, swagger_1.ApiOperation)({ summary: 'New product (commercial roles)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.CreateProductDto, Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('products/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit or archive (active = false) a product' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, inventory_dto_1.UpdateProductDto, Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "update", null);
__decorate([
    (0, common_1.Get)('products/:id/kardex'),
    (0, swagger_1.ApiOperation)({ summary: 'Kardex of a product in a branch (or the company) with its running balance' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('sucursalId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "kardex", null);
__decorate([
    (0, common_1.Get)('movements'),
    (0, swagger_1.ApiOperation)({ summary: 'History: by branch, types, Bolivian days and product' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.ListMovementsQuery, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "movements", null);
__decorate([
    (0, common_1.Post)('movements/lote'),
    (0, swagger_1.ApiOperation)({ summary: 'Several products moved the same way (entrada, transferencia, baja…) in one transaction' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.StockBatchDto, Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "batch", null);
__decorate([
    (0, common_1.Post)('movements'),
    (0, swagger_1.ApiOperation)({ summary: 'Entrada, transferencia, salida a proyecto, baja or ajuste (Gerencia)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [inventory_dto_1.StockMovementDto, Object, String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "move", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map