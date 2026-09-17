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
exports.RealtimeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_1 = require("@nestjs/jwt");
const auth_guard_1 = require("../auth/auth.guard");
const realtime_service_1 = require("./realtime.service");
let RealtimeController = class RealtimeController {
    realtime;
    jwt;
    constructor(realtime, jwt) {
        this.realtime = realtime;
        this.jwt = jwt;
    }
    async ticket(req) {
        const token = await this.jwt.signAsync({ sub: req.user.id, purpose: 'sse' }, { expiresIn: '60s' });
        return { token, expiresIn: 60 };
    }
    async events(accessToken) {
        const token = String(accessToken || '').trim();
        if (!token)
            throw new common_1.UnauthorizedException('Ticket SSE requerido');
        try {
            const payload = await this.jwt.verifyAsync(token);
            if (payload.purpose !== 'sse')
                throw new common_1.UnauthorizedException('Ticket inválido');
        }
        catch {
            throw new common_1.UnauthorizedException('Ticket SSE inválido o vencido');
        }
        return this.realtime.stream();
    }
};
exports.RealtimeController = RealtimeController;
__decorate([
    (0, common_1.Post)('ticket'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Emit short-lived SSE ticket (query token)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "ticket", null);
__decorate([
    (0, common_1.Sse)('events'),
    (0, swagger_1.ApiOperation)({ summary: 'SSE stream — pass ticket as ?access_token=' }),
    __param(0, (0, common_1.Query)('access_token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RealtimeController.prototype, "events", null);
exports.RealtimeController = RealtimeController = __decorate([
    (0, swagger_1.ApiTags)('realtime'),
    (0, common_1.Controller)('realtime'),
    __metadata("design:paramtypes", [realtime_service_1.RealtimeService,
        jwt_1.JwtService])
], RealtimeController);
//# sourceMappingURL=realtime.controller.js.map