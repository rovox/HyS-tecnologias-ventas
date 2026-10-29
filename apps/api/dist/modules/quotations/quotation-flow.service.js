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
var QuotationFlowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationFlowService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
const quotations_rules_1 = require("./domain/quotations.rules");
const quotation_presenter_1 = require("./quotation.presenter");
const projects_1 = require("../projects");
const HOUR_MS = 60 * 60 * 1000;
let QuotationFlowService = QuotationFlowService_1 = class QuotationFlowService {
    prisma;
    audit;
    projects;
    logger = new common_1.Logger(QuotationFlowService_1.name);
    expiryTimer;
    constructor(prisma, audit, projects) {
        this.prisma = prisma;
        this.audit = audit;
        this.projects = projects;
    }
    async row(id, user) {
        const row = await this.prisma.quotation.findFirst({ where: { id, ...(0, roles_1.quotationWhere)(user) }, include: quotation_presenter_1.DETAIL });
        if (!row)
            throw new common_1.NotFoundException('Cotización no encontrada');
        return row;
    }
    async get(id, user) {
        return (0, quotation_presenter_1.present)(await this.row(id, user));
    }
    startTimers() {
        const run = () => this.expireOverdue().catch((err) => this.logger.error(`Vencimiento de cotizaciones: ${err}`));
        run();
        this.expiryTimer = setInterval(run, HOUR_MS);
        this.expiryTimer.unref();
    }
    onModuleDestroy() {
        clearInterval(this.expiryTimer);
    }
    async expireOverdue(now = new Date()) {
        const due = await this.prisma.quotation.findMany({
            where: { estado: 'enviado', eliminadaAt: null, fechaEnvio: { lt: (0, quotations_rules_1.expiryCutoff)(now) } },
            select: { id: true },
        });
        if (!due.length)
            return 0;
        await this.prisma.quotation.updateMany({ where: { id: { in: due.map((q) => q.id) } }, data: { estado: 'vencido' } });
        for (const { id } of due) {
            await this.audit.record({ action: 'quotation.expire', entity: 'quotation', id, patch: { estado: 'vencido' } });
        }
        return due.length;
    }
    async updateStatus(id, estado, user, sessionId, motivoRechazo, fechaEnvio) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.row(id, user);
        const transition = (0, quotations_rules_1.checkQuotationTransition)(current, estado, { motivo: motivoRechazo });
        if (!transition.ok)
            throw new common_1.BadRequestException(transition.reason);
        if (estado === 'aprobado')
            return (await this.accept(id, {}, user, sessionId)).quotation;
        const quote = await this.prisma.quotation.update({
            where: { id },
            data: {
                estado,
                ...(estado === 'rechazado' ? { motivoRechazo: motivoRechazo.trim() } : {}),
                ...(estado === 'enviado' ? { fechaEnvio: fechaEnvio ? new Date(fechaEnvio) : new Date() } : {}),
                ...(estado === 'borrador' ? { motivoRechazo: null } : {}),
            },
            include: quotation_presenter_1.DETAIL,
        });
        await this.prisma.touchClientActivity(current.clienteId);
        await this.audit.record({ user, sessionId, action: 'quotation.status', entity: 'quotation', id, before: current, after: quote, patch: { estado } });
        return (0, quotation_presenter_1.present)(quote);
    }
    async remove(id, motivo, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.row(id, user);
        const error = (0, quotations_rules_1.deleteError)(current, motivo);
        if (error)
            throw new common_1.BadRequestException(error);
        const quote = await this.prisma.quotation.update({
            where: { id },
            data: { eliminadaAt: new Date(), eliminadaPorId: user.id, motivoEliminacion: motivo.trim() },
            include: quotation_presenter_1.DETAIL,
        });
        await this.audit.record({ user, sessionId, action: 'quotation.delete', entity: 'quotation', id, before: current, after: quote });
        return (0, quotation_presenter_1.present)(quote);
    }
    async restore(id, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.row(id, user);
        const error = (0, quotations_rules_1.restoreError)(current);
        if (error)
            throw new common_1.BadRequestException(error);
        const quote = await this.prisma.quotation.update({
            where: { id },
            data: { eliminadaAt: null, eliminadaPorId: null, motivoEliminacion: null },
            include: quotation_presenter_1.DETAIL,
        });
        await this.audit.record({ user, sessionId, action: 'quotation.restore', entity: 'quotation', id, before: current, after: quote });
        return (0, quotation_presenter_1.present)(quote);
    }
    async accept(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.row(id, user);
        const error = (0, quotations_rules_1.acceptError)(current);
        if (error)
            throw new common_1.BadRequestException(error);
        const existing = await this.prisma.project.findUnique({
            where: { quotationId: id },
            include: { schedules: { orderBy: { createdAt: 'asc' }, take: 1 } },
        });
        if (current.estado === 'aprobado' && existing) {
            return { quotation: (0, quotation_presenter_1.present)(current), project: existing, schedule: existing.schedules[0] ?? null, alreadyConverted: true };
        }
        const { project, schedule } = await this.prisma.$transaction(async (tx) => {
            await tx.quotation.update({ where: { id }, data: { estado: 'aprobado' } });
            if (existing)
                return { project: existing, schedule: existing.schedules[0] ?? null };
            return this.projects.createFromQuotation(tx, { ...current, monto: Number(current.monto), clienteId: current.clienteId }, dto);
        });
        await this.prisma.touchClientActivity(current.clienteId);
        await this.audit.record({
            user,
            sessionId,
            action: 'quotation.approve',
            entity: 'quotation',
            id,
            patch: { estado: 'aprobado' },
            affects: existing ? [] : ['project', 'schedule', 'client'],
        });
        return { quotation: await this.get(id, user), project, schedule, alreadyConverted: Boolean(existing) };
    }
};
exports.QuotationFlowService = QuotationFlowService;
exports.QuotationFlowService = QuotationFlowService = QuotationFlowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        projects_1.ProjectsService])
], QuotationFlowService);
//# sourceMappingURL=quotation-flow.service.js.map