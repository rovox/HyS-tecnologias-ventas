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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const realtime_service_1 = require("../realtime/realtime.service");
const audit_diff_1 = require("../domain/audit-diff");
let AuditService = class AuditService {
    prisma;
    realtime;
    constructor(prisma, realtime) {
        this.prisma = prisma;
        this.realtime = realtime;
    }
    async record(entry) {
        await this.log(entry);
        this.realtime.emit(entry.action, entry.entity, entry.id, {
            byUserId: entry.user?.id,
            patch: entry.patch,
            affects: entry.affects,
        });
    }
    async log(entry) {
        if (!entry.user || !entry.sessionId)
            return;
        const changes = (0, audit_diff_1.fieldChanges)(entry.before, entry.after);
        await this.prisma.activity.create({
            data: {
                userId: entry.user.id,
                sessionId: entry.sessionId,
                action: entry.action,
                entityType: entry.entity,
                entityId: entry.id,
                detalle: Object.keys(changes).length ? changes : undefined,
            },
        });
    }
    list(filter) {
        return this.prisma.activity.findMany({
            take: Math.min(filter.limit || 100, 500),
            orderBy: { at: 'desc' },
            where: {
                ...(filter.userId ? { userId: filter.userId } : {}),
                ...(filter.action ? { action: { contains: filter.action } } : {}),
                ...(filter.entity ? { entityType: filter.entity } : {}),
                ...(filter.entityId ? { entityId: filter.entityId } : {}),
            },
            include: { user: { select: { id: true, name: true, email: true } } },
        });
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        realtime_service_1.RealtimeService])
], AuditService);
//# sourceMappingURL=audit.service.js.map