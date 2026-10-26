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
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const policy_1 = require("../../common/policy/policy");
const roles_1 = require("../../common/policy/roles");
const USER_PROFILE = { id: true, email: true, name: true, role: true, phone: true, active: true, monthlyGoalBs: true, sucursalId: true };
function toProfile(row) {
    return { ...row, monthlyGoalBs: Number(row.monthlyGoalBs), department: row.sucursalId };
}
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
    audit;
    constructor(prisma, jwt, audit) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.audit = audit;
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
        await this.audit.log({ user, sessionId: session.id, action: 'login', entity: 'session', id: session.id });
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
            await this.audit.log({ user, sessionId, action: 'logout', entity: 'session', id: sessionId });
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
                await this.audit.log({ user, sessionId: open.id, action: 'forgot_password', entity: 'user', id: user.id });
        }
        return { ok: true };
    }
    async listUsers(actor) {
        if (!(0, policy_1.canListUsers)(actor))
            throw new common_1.ForbiddenException('Sin permiso para listar usuarios');
        const rows = await this.prisma.user.findMany({
            where: { active: true },
            select: USER_PROFILE,
            orderBy: { name: 'asc' },
        });
        return rows.map(toProfile);
    }
    async userDirectory(actor) {
        if (!(0, policy_1.canListUserDirectory)(actor))
            throw new common_1.ForbiddenException('Sin permiso para ver usuarios');
        return this.prisma.user.findMany({
            where: { active: true },
            select: { id: true, name: true, role: true },
            orderBy: { name: 'asc' },
        });
    }
    async getUser(actor, id) {
        if (!(0, policy_1.canViewUser)(actor, id))
            throw new common_1.ForbiddenException('Sin acceso a este perfil');
        const row = await this.prisma.user.findUnique({ where: { id }, select: USER_PROFILE });
        if (!row)
            throw new common_1.NotFoundException('Usuario no encontrado');
        return toProfile(row);
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
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map