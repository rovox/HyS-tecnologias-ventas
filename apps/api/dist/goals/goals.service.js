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
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
function monthStart(month) {
    const prefix = month || new Date().toISOString().slice(0, 7);
    const start = new Date(`${prefix}-01T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()))
        throw new common_1.BadRequestException('Mes inválido');
    return { prefix, start };
}
let GoalsService = class GoalsService {
    prisma;
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    list(user, month) {
        const { start } = monthStart(month);
        return this.prisma.sellerGoal.findMany({
            where: { mes: start, ...((0, roles_1.isVentas)(user) && !(0, roles_1.isAdmin)(user) ? { usuarioId: user.id } : {}) },
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
        await this.activity.log(user.id, sessionId, 'goal.upsert', 'seller_goal', row.id);
        return row;
    }
};
exports.GoalsService = GoalsService;
exports.GoalsService = GoalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], GoalsService);
//# sourceMappingURL=goals.service.js.map