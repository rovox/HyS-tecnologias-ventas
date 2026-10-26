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
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const roles_1 = require("../../common/policy/roles");
const roles_guard_1 = require("../../common/auth/roles.guard");
const quotation_dto_1 = require("./dto/quotation.dto");
const quotations_service_1 = require("./quotations.service");
const quotation_files_service_1 = require("./quotation-files.service");
const quotation_flow_service_1 = require("./quotation-flow.service");
let QuotationsController = class QuotationsController {
    quotations;
    quotationFiles;
    flow;
    constructor(quotations, quotationFiles, flow) {
        this.quotations = quotations;
        this.quotationFiles = quotationFiles;
        this.flow = flow;
    }
    list(query, user) {
        return this.quotations.list(query, user);
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
        return this.flow.updateStatus(id, dto.estado, user, sessionId, dto.motivoRechazo, dto.fechaEnvio);
    }
    remove(id, dto, user, sessionId) {
        return this.flow.remove(id, dto.motivo, user, sessionId);
    }
    restore(id, user, sessionId) {
        return this.flow.restore(id, user, sessionId);
    }
    accept(id, dto, user, sessionId) {
        return this.flow.accept(id, dto, user, sessionId);
    }
    files(id, kind, file, user, sessionId) {
        return this.quotationFiles.attachFile(id, file, user, sessionId, kind || 'pdf');
    }
};
exports.QuotationsController = QuotationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List quotations (vista=abiertas | cerradas, filters, search)' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [quotation_dto_1.ListQuotationsQuery, Object]),
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
    (0, common_1.Post)(':id/eliminar'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Delete (hide) a quotation with a reason; it stays in "cerradas" and can be restored' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quotation_dto_1.DeleteQuotationDto, Object, String]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/restaurar'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Restore a deleted quotation' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], QuotationsController.prototype, "restore", null);
__decorate([
    (0, common_1.Post)(':id/accept'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Approve quotation: creates the project (idempotent)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, quotation_dto_1.AcceptQuotationDto, Object, String]),
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
    __metadata("design:paramtypes", [quotations_service_1.QuotationsService,
        quotation_files_service_1.QuotationFilesService,
        quotation_flow_service_1.QuotationFlowService])
], QuotationsController);
let QuotationFilesController = class QuotationFilesController {
    files;
    constructor(files) {
        this.files = files;
    }
    async getFile(name, user, res) {
        const full = await this.files.filePath(name, user);
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
    __metadata("design:paramtypes", [quotation_files_service_1.QuotationFilesService])
], QuotationFilesController);
//# sourceMappingURL=quotations.controller.js.map