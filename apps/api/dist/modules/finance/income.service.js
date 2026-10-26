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
exports.IncomeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
const finance_rules_1 = require("./domain/finance.rules");
const movement_presenter_1 = require("./movement.presenter");
const COUNTED_SELECT = { tipo: true, concepto: true, monto: true, estado: true };
let IncomeService = class IncomeService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async target(ref) {
        if (ref.relevamientoId) {
            const visit = await this.prisma.relevamiento.findUnique({ where: { id: ref.relevamientoId } });
            if (!visit)
                throw new common_1.NotFoundException('Visita no encontrada');
            const sucursalId = visit.sucursalId ?? (await this.prisma.client.findUnique({ where: { id: visit.clienteId }, select: { sucursalId: true } }))?.sucursalId;
            if (!sucursalId)
                throw new common_1.BadRequestException('La visita no tiene sucursal');
            return {
                projectId: null,
                scheduleId: null,
                relevamientoId: visit.id,
                clienteId: visit.clienteId,
                sucursalId,
                monto: 0,
                cobrado: 0,
                cancelled: visit.estado === 'cancelado',
                closed: false,
                technicians: [visit.tecnicoId, visit.usuarioId],
            };
        }
        if (ref.scheduleId) {
            const job = await this.prisma.schedule.findUnique({ where: { id: ref.scheduleId } });
            if (!job)
                throw new common_1.NotFoundException('Trabajo no encontrado');
            if (job.projectId)
                return { ...(await this.target({ projectId: job.projectId })), scheduleId: job.id };
            const movements = await this.prisma.cashMovement.findMany({ where: { scheduleId: job.id, projectId: null }, select: COUNTED_SELECT });
            return {
                projectId: null,
                scheduleId: job.id,
                relevamientoId: null,
                clienteId: job.clienteId,
                sucursalId: job.sucursalId,
                monto: Number(job.monto),
                cobrado: (0, finance_rules_1.incomeOf)(movements).cobrado,
                cancelled: job.estado === 'cancelado',
                closed: false,
                technicians: [job.tecnicoId],
            };
        }
        const project = await this.prisma.project.findUnique({
            where: { id: ref.projectId },
            include: { schedules: { select: { tecnicoId: true } } },
        });
        if (!project)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        const movements = await this.prisma.cashMovement.findMany({ where: { projectId: project.id }, select: COUNTED_SELECT });
        return {
            projectId: project.id,
            scheduleId: null,
            relevamientoId: null,
            clienteId: project.clienteId,
            sucursalId: project.sucursalId,
            monto: Number(project.montoOficial),
            cobrado: (0, finance_rules_1.incomeOf)(movements).cobrado,
            cancelled: project.estado === 'anulado',
            closed: project.estado === 'cerrado',
            technicians: project.schedules.map((s) => s.tecnicoId),
        };
    }
    async register(ref, dto, user, sessionId) {
        const target = await this.target(ref);
        const allowed = (0, roles_1.isAdmin)(user) || (0, roles_1.isVentas)(user) || (0, roles_1.isConta)(user) || ((0, roles_1.isTec)(user) && target.technicians.includes(user.id));
        if (!allowed)
            throw new common_1.ForbiddenException('Solo registras cobros de tus trabajos');
        const error = (0, finance_rules_1.movementError)({ tipo: 'ingreso', concepto: dto.concepto, monto: dto.monto }) ||
            (0, finance_rules_1.incomeConceptError)(target.relevamientoId ? 'visita' : 'trabajo', dto.concepto) ||
            (0, finance_rules_1.incomeError)(target, dto.concepto, dto.monto);
        if (error)
            throw new common_1.BadRequestException(error);
        const recibidoPorId = dto.recibidoPorId || user.id;
        if (recibidoPorId !== user.id) {
            if ((0, roles_1.isTec)(user))
                throw new common_1.ForbiddenException('Registra solo el dinero que recibiste tú');
            const person = await this.prisma.user.findUnique({ where: { id: recibidoPorId }, select: { active: true } });
            if (!person?.active)
                throw new common_1.BadRequestException('La persona que recibió el dinero no existe o está inactiva');
        }
        const row = await this.prisma.cashMovement.create({
            data: {
                tipo: 'ingreso',
                concepto: dto.concepto,
                monto: dto.monto,
                metodo: dto.metodo || '',
                nota: dto.nota || '',
                projectId: target.projectId,
                scheduleId: target.scheduleId,
                relevamientoId: target.relevamientoId,
                clienteId: target.clienteId,
                sucursalId: target.sucursalId,
                registradoPorId: user.id,
                recibidoPorId,
            },
            include: movement_presenter_1.MOVEMENT_DETAIL,
        });
        await this.audit.record({
            user,
            sessionId,
            action: 'movement.income',
            entity: 'movement',
            id: row.id,
            affects: [...(target.projectId ? ['project'] : []), ...(target.scheduleId ? ['schedule'] : []), ...(target.relevamientoId ? ['relevamiento'] : []), 'client'],
            patch: { concepto: dto.concepto, monto: dto.monto },
        });
        return (0, movement_presenter_1.presentMovement)(row);
    }
};
exports.IncomeService = IncomeService;
exports.IncomeService = IncomeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], IncomeService);
//# sourceMappingURL=income.service.js.map