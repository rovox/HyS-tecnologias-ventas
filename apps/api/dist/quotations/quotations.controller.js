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
exports.QuotationFilesController = exports.QuotationsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const roles_1 = require("../auth/roles");
const roles_guard_1 = require("../auth/roles.guard");
const quotation_dto_1 = require("./dto/quotation.dto");
const quotations_service_1 = require("./quotations.service");
let QuotationsController = class QuotationsController {
    quotations;
    constructor(quotations) {
        this.quotations = quotations;
    }
    list(estado, vendedorId, sucursalId, user) {
        return this.quotations.list({ estado, vendedorId, sucursalId }, user);
    }
    get(id, user) {
        return this.quotations.get(id, user);
    }
    create(dto, user, sessionId) {
        return this.quotations.create(dto, user, sessionId);
    }
    patch(id, dto, user, sessionId) {
        return this.quotations.update(id, dto, user, sessionId);
    }
    status(id, dto, user, sessionId) {
        return this.quotations.updateStatus(id, dto.estado, user, sessionId, dto.motivoRechazo, dto.fechaEnvio);
    }
    accept(id, user, sessionId) {
        return this.quotations.accept(id, user, sessionId);
    }
    files(id, kind, file, user, sessionId) {
        return this.quotations.attachFile(id, file, user, sessionId, kind || 'pdf');
    }
};
exports.QuotationsController = QuotationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List quotations' }),
    __param(0, (0, common_1.Query)('estado')),
    __param(1, (0, common_1.Query)('vendedorId')),
    __param(2, (0, common_1.Query)('sucursalId')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get quotation by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Create quotation' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quotation_dto_1.CreateQuotationDto, Object, String]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Update quotation (encargado, licitación, plazo)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quotation_dto_1.UpdateQuotationDto, Object, String]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "patch", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Change quotation status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quotation_dto_1.StatusDto, Object, String]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "status", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Accept quotation (shortcut)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "accept", null);
__decorate([
    (0, common_1.Post)(':id/files'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload quotation PDF' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 15 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('kind')),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __param(4, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object, String]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "files", null);
exports.QuotationsController = QuotationsController = __decorate([
    (0, swagger_1.ApiTags)('quotations'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('quotations'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [quotations_service_1.QuotationsService])
], QuotationsController);
let QuotationFilesController = class QuotationFilesController {
    quotations;
    constructor(quotations) {
        this.quotations = quotations;
    }
    async getFile(name, user, res) {
        const full = await this.quotations.filePath(name, user);
        return res.sendFile(full);
    }
};
exports.QuotationFilesController = QuotationFilesController;
__decorate([
    (0, common_1.Get)(':name'),
    (0, swagger_1.ApiOperation)({ summary: 'Download quotation PDF by stored name' }),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], QuotationFilesController.prototype, "getFile", null);
exports.QuotationFilesController = QuotationFilesController = __decorate([
    (0, swagger_1.ApiTags)('files'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('files/quotations'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [quotations_service_1.QuotationsService])
], QuotationFilesController);
//# sourceMappingURL=quotations.controller.js.map