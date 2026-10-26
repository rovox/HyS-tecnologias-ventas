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
exports.PedidosInternosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const pedido_interno_dto_1 = require("./dto/pedido-interno.dto");
const pedidos_internos_service_1 = require("./pedidos-internos.service");
let PedidosInternosController = class PedidosInternosController {
    service;
    constructor(service) {
        this.service = service;
    }
    findAll(query, user) {
        return this.service.findAll(user, query);
    }
    findOne(id, user) {
        return this.service.findOne(id, user);
    }
    create(dto, user, sessionId) {
        return this.service.create(dto, user, sessionId);
    }
    update(id, dto, user, sessionId) {
        return this.service.update(id, dto, user, sessionId);
    }
    remove(id, user, sessionId) {
        return this.service.remove(id, user, sessionId);
    }
    updateEstado(id, dto, user, sessionId) {
        return this.service.updateEstado(id, dto, user, sessionId);
    }
    addComentario(id, dto, user, sessionId) {
        return this.service.addComentario(id, dto, user, sessionId);
    }
};
exports.PedidosInternosController = PedidosInternosController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar pedidos internos' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PedidosInternosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener pedido interno por ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PedidosInternosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear pedido interno' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pedido_interno_dto_1.UpsertPedidoInternoDto, Object, String]),
    __metadata("design:returntype", void 0)
], PedidosInternosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar pedido interno' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedido_interno_dto_1.UpsertPedidoInternoDto, Object, String]),
    __metadata("design:returntype", void 0)
], PedidosInternosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Eliminar pedido interno' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], PedidosInternosController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estado del pedido' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedido_interno_dto_1.UpdateEstadoPedidoDto, Object, String]),
    __metadata("design:returntype", void 0)
], PedidosInternosController.prototype, "updateEstado", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Agregar comentario al pedido' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, pedido_interno_dto_1.AddComentarioDto, Object, String]),
    __metadata("design:returntype", void 0)
], PedidosInternosController.prototype, "addComentario", null);
exports.PedidosInternosController = PedidosInternosController = __decorate([
    (0, swagger_1.ApiTags)('pedidos-internos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('pedidos-internos'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [pedidos_internos_service_1.PedidosInternosService])
], PedidosInternosController);
//# sourceMappingURL=pedidos-internos.controller.js.map