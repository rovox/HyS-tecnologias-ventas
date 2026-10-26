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
exports.SolicitudesWebController = exports.SolicitudesWebhookController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const solicitud_web_dto_1 = require("./dto/solicitud-web.dto");
const solicitudes_web_service_1 = require("./solicitudes-web.service");
const webhook_key_guard_1 = require("./webhook-key.guard");
let SolicitudesWebhookController = class SolicitudesWebhookController {
    solicitudes;
    constructor(solicitudes) {
        this.solicitudes = solicitudes;
    }
    create(dto) {
        return this.solicitudes.createFromWebhook(dto);
    }
};
exports.SolicitudesWebhookController = SolicitudesWebhookController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(201),
    (0, swagger_1.ApiHeader)({ name: 'X-HS-Webhook-Key', required: true }),
    (0, swagger_1.ApiOperation)({ summary: 'Store a contact-form request from hstecnologias.com' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [solicitud_web_dto_1.WebhookSolicitudDto]),
    __metadata("design:returntype", void 0)
], SolicitudesWebhookController.prototype, "create", null);
exports.SolicitudesWebhookController = SolicitudesWebhookController = __decorate([
    (0, swagger_1.ApiTags)('solicitudes-web'),
    (0, common_1.Controller)('solicitudes-web/webhook'),
    (0, common_1.UseGuards)(webhook_key_guard_1.WebhookKeyGuard),
    __metadata("design:paramtypes", [solicitudes_web_service_1.SolicitudesWebService])
], SolicitudesWebhookController);
let SolicitudesWebController = class SolicitudesWebController {
    solicitudes;
    constructor(solicitudes) {
        this.solicitudes = solicitudes;
    }
    list(user, estado, q) {
        return this.solicitudes.list(user, estado, q);
    }
    get(id, user) {
        return this.solicitudes.get(id, user);
    }
    update(id, dto, user, sessionId) {
        return this.solicitudes.update(id, dto, user, sessionId);
    }
    convert(id, user, sessionId) {
        return this.solicitudes.convert(id, user, sessionId);
    }
};
exports.SolicitudesWebController = SolicitudesWebController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List web requests (optional estado / q filters)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SolicitudesWebController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get web request by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SolicitudesWebController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update state (nueva / contactada / descartada) or notes' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, solicitud_web_dto_1.UpdateSolicitudDto, Object, String]),
    __metadata("design:returntype", void 0)
], SolicitudesWebController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/convertir'),
    (0, swagger_1.ApiOperation)({ summary: 'Convert into an official client (reuses an existing match)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], SolicitudesWebController.prototype, "convert", null);
exports.SolicitudesWebController = SolicitudesWebController = __decorate([
    (0, swagger_1.ApiTags)('solicitudes-web'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('solicitudes-web'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [solicitudes_web_service_1.SolicitudesWebService])
], SolicitudesWebController);
//# sourceMappingURL=solicitudes-web.controller.js.map