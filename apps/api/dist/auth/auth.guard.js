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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthGuard = class AuthGuard {
    jwt;
    prisma;
    constructor(jwt, prisma) {
        this.jwt = jwt;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const header = String(req.headers.authorization || '');
        const token = header.startsWith('Bearer ') ? header.slice(7) : '';
        if (!token)
            throw new common_1.UnauthorizedException('Sesión requerida');
        let payload;
        try {
            payload = await this.jwt.verifyAsync(token);
        }
        catch {
            throw new common_1.UnauthorizedException('Token inválido o vencido');
        }
        if (!payload.sessionId) {
            throw new common_1.UnauthorizedException('Sesión requerida');
        }
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user || !user.active)
            throw new common_1.UnauthorizedException('Cuenta inactiva');
        const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId } });
        if (!session || session.endedAt)
            throw new common_1.UnauthorizedException('Sesión cerrada');
        req.user = user;
        req.sessionId = payload.sessionId;
        return true;
    }
};
exports.AuthGuard = AuthGuard;
exports.AuthGuard = AuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], AuthGuard);
//# sourceMappingURL=auth.guard.js.map