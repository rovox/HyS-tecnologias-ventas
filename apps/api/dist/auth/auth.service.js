"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcryptjs"));
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("./activity.service");
const roles_1 = require("./roles");
function publicUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        active: user.active,
        monthlyGoalBs: Number(user.monthlyGoalBs),
        sucursalId: user.sucursalId,
        department: user.sucursalId,
    };
}
let AuthService = class AuthService {
    prisma;
    jwt;
    activity;
    constructor(prisma, jwt, activity) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.activity = activity;
    }
    async login(dto, ip, userAgent) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
        if (!user || !user.active)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const ok = await bcrypt.compare(dto.password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        const session = await this.prisma.session.create({
            data: { userId: user.id, ip: ip || null, userAgent: userAgent || null },
        });
        await this.activity.log(user.id, session.id, 'login', 'session', session.id);
        const accessToken = await this.jwt.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: session.id,
        });
        return { user: publicUser(user), accessToken };
    }
    async logout(user, sessionId) {
        if (sessionId) {
            await this.prisma.session.updateMany({
                where: { id: sessionId, endedAt: null },
                data: { endedAt: new Date() },
            });
            await this.activity.log(user.id, sessionId, 'logout', 'session', sessionId);
        }
        return { ok: true };
    }
    me(user) {
        return publicUser(user);
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (user) {
            const open = await this.prisma.session.findFirst({
                where: { userId: user.id, endedAt: null },
                orderBy: { startedAt: 'desc' },
            });
            if (open)
                await this.activity.log(user.id, open.id, 'forgot_password', 'user', user.id);
        }
        return { ok: true };
    }
    async listUsers(actor) {
        if (!(0, roles_1.isAdmin)(actor) && !(0, roles_1.isVentas)(actor))
            throw new common_1.ForbiddenException('Sin permiso para listar usuarios');
        const rows = await this.prisma.user.findMany({
            where: { active: true },
            select: { id: true, email: true, name: true, role: true, phone: true, active: true, monthlyGoalBs: true, sucursalId: true },
            orderBy: { name: 'asc' },
        });
        return rows.map((row) => ({ ...row, monthlyGoalBs: Number(row.monthlyGoalBs), department: row.sucursalId }));
    }
    async listSessions(actor) {
        (0, roles_1.assertAdmin)(actor);
        return this.prisma.session.findMany({
            orderBy: { startedAt: 'desc' },
            take: 100,
            include: { user: { select: { id: true, email: true, name: true, role: true } } },
        });
    }
    async sessionActivity(actor, sessionId) {
        (0, roles_1.assertAdmin)(actor);
        return this.prisma.activity.findMany({
            where: { sessionId },
            orderBy: { at: 'desc' },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        activity_service_1.ActivityService])
], AuthService);
//# sourceMappingURL=auth.service.js.map