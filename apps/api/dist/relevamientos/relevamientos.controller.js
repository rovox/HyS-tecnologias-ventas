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
exports.RelevamientoFilesController = exports.RelevamientosController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const relevamiento_dto_1 = require("./dto/relevamiento.dto");
const relevamientos_service_1 = require("./relevamientos.service");
let RelevamientosController = class RelevamientosController {
    relevamientos;
    constructor(relevamientos) {
        this.relevamientos = relevamientos;
    }
    list(user, cotizacionId) {
        return this.relevamientos.list(user, cotizacionId);
    }
    get(id, user) {
        return this.relevamientos.get(id, user);
    }
    create(dto, user, sessionId) {
        return this.relevamientos.create(dto, user, sessionId);
    }
    update(id, dto, user, sessionId) {
        return this.relevamientos.update(id, dto, user, sessionId);
    }
    files(id, file, user, sessionId) {
        return this.relevamientos.attachPhoto(id, file, user, sessionId);
    }
};
exports.RelevamientosController = RelevamientosController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List relevamientos' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('cotizacionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get relevamiento by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create relevamiento' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [relevamiento_dto_1.UpsertRelevamientoDto, Object, String]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update relevamiento (resuelto requiere foto)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/files'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload evidence photo' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: { file: { type: 'string', format: 'binary' } },
        },
    }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 8 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", void 0)
], RelevamientosController.prototype, "files", null);
exports.RelevamientosController = RelevamientosController = __decorate([
    (0, swagger_1.ApiTags)('relevamientos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('relevamientos'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [relevamientos_service_1.RelevamientosService])
], RelevamientosController);
let RelevamientoFilesController = class RelevamientoFilesController {
    relevamientos;
    constructor(relevamientos) {
        this.relevamientos = relevamientos;
    }
    async getFile(name, res) {
        const full = await this.relevamientos.filePath(name);
        return res.sendFile(full);
    }
};
exports.RelevamientoFilesController = RelevamientoFilesController;
__decorate([
    (0, common_1.Get)(':name'),
    (0, swagger_1.ApiOperation)({ summary: 'Download relevamiento photo' }),
    __param(0, (0, common_1.Param)('name')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RelevamientoFilesController.prototype, "getFile", null);
exports.RelevamientoFilesController = RelevamientoFilesController = __decorate([
    (0, swagger_1.ApiTags)('files'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('files/relevamientos'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [relevamientos_service_1.RelevamientosService])
], RelevamientoFilesController);
//# sourceMappingURL=relevamientos.controller.js.map