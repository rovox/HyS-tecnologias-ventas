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
exports.GoalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
function monthStart(month) {
    const prefix = month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${prefix}-01T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()))
        throw new common_1.BadRequestException('Mes inválido');
    return { prefix, start };
}
let GoalsService = class GoalsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    list(user, month) {
        const { start } = monthStart(month);
        return this.prisma.sellerGoal.findMany({
            where: { mes: start, ...(0, roles_1.goalWhere)(user) },
            include: { usuario: { select: { id: true, name: true, role: true } } },
        });
    }
    async upsert(dto, user, sessionId) {
        (0, roles_1.assertAdmin)(user);
        const { start } = monthStart(dto.month);
        const row = await this.prisma.sellerGoal.upsert({
            where: { usuarioId_mes: { usuarioId: dto.usuarioId, mes: start } },
            update: { metaMonto: dto.metaMonto, metaCotiz: dto.metaCotiz },
            create: { usuarioId: dto.usuarioId, mes: start, metaMonto: dto.metaMonto, metaCotiz: dto.metaCotiz },
        });
        await this.audit.record({ user, sessionId, action: 'goal.upsert', entity: 'goal', id: row.id });
        return row;
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map