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
exports.SchedulesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const roles_1 = require("../../common/policy/roles");
const audit_service_1 = require("../../common/audit/audit.service");
const schedules_rules_1 = require("./domain/schedules.rules");
const categories_1 = require("../categories");
const finance_1 = require("../finance");
const include = {
    cliente: true,
    sucursal: true,
    vendedor: { select: { id: true, name: true } },
    tecnico: { select: { id: true, name: true } },
    quotation: { select: { id: true, numero: true, titulo: true, monto: true } },
    categoria: { select: { id: true, label: true } },
    project: {
        select: {
            id: true,
            codigo: true,
            estado: true,
            montoOficial: true,
            movements: { where: { tipo: 'ingreso', estado: { not: 'anulado' } }, select: { tipo: true, concepto: true, monto: true, estado: true } },
        },
    },
    movements: {
        where: { tipo: 'ingreso' },
        select: { id: true, concepto: true, monto: true, estado: true, metodo: true, nota: true, fecha: true, tipo: true },
        orderBy: { fecha: 'desc' },
    },
};
function projectMoney({ movements, montoOficial, ...project }) {
    const monto = Number(montoOficial);
    const { cobrado } = (0, finance_1.incomeOf)(movements);
    return { ...project, monto, cobrado, saldo: (0, finance_1.balanceOf)(monto, cobrado, project.estado === 'anulado'), pctCobrado: monto > 0 ? Math.min(100, Math.round((cobrado / monto) * 100)) : 0 };
}
function present(row) {
    const { movements, project, ...job } = row;
    const cobrado = row.projectId ? 0 : (0, finance_1.incomeOf)(movements).cobrado;
    return {
        ...job,
        project: project ? projectMoney(project) : null,
        adelanto: cobrado,
        saldo: row.projectId ? 0 : (0, finance_1.balanceOf)(Number(row.monto), cobrado, row.estado === 'cancelado'),
        movements,
    };
}
const affectsOf = (row, base = []) => (row.projectId ? [...base, 'project'] : base);
let SchedulesService = class SchedulesService {
    prisma;
    audit;
    categories;
    income;
    constructor(prisma, audit, categories, income) {
        this.prisma = prisma;
        this.audit = audit;
        this.categories = categories;
        this.income = income;
    }
    list(user, filters = {}) {
        return this.prisma.schedule.findMany({
            where: {
                ...(0, roles_1.scheduleWhere)(user),
                ...(filters.estado ? { estado: filters.estado } : {}),
                ...(filters.sucursalId ? { sucursalId: filters.sucursalId } : {}),
                ...(filters.tecnicoId ? { tecnicoId: filters.tecnicoId } : {}),
                ...(filters.quotationId ? { quotationId: filters.quotationId } : {}),
                ...(filters.clienteId ? { clienteId: filters.clienteId } : {}),
                ...(filters.from || filters.to
                    ? {
                        fechaProgramada: {
                            ...(filters.from ? { gte: new Date(filters.from) } : {}),
                            ...(filters.to ? { lte: new Date(filters.to) } : {}),
                        },
                    }
                    : {}),
            },
            include,
            orderBy: { fechaProgramada: 'asc' },
        }).then((rows) => rows.map(present));
    }
    async get(id, user) {
        const row = await this.prisma.schedule.findFirst({
            where: { id, ...(0, roles_1.scheduleWhere)(user) },
            include,
        });
        if (!row)
            throw new common_1.NotFoundException('Trabajo no encontrado');
        return present(row);
    }
    async create(dto, user, sessionId, options = {}) {
        (0, roles_1.assertCanCreateSchedules)(user);
        const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
        if (!client)
            throw new common_1.BadRequestException('Cliente no encontrado');
        const sucursal = await this.prisma.sucursal.findUnique({ where: { id: dto.sucursalId } });
        if (!sucursal)
            throw new common_1.BadRequestException('Sucursal no válida');
        let categoriaId = dto.categoriaId;
        if (dto.quotationId) {
            const quote = await this.prisma.quotation.findUnique({ where: { id: dto.quotationId } });
            if (!quote)
                throw new common_1.BadRequestException('Cotización no encontrada');
            categoriaId = quote.categoriaId;
        }
        else {
            await this.categories.assertDivision(categoriaId);
        }
        const monto = Number(dto.monto ?? 0);
        const adelanto = Number(dto.adelanto ?? 0);
        const row = await this.prisma.schedule.create({
            data: {
                categoriaId: categoriaId,
                clienteId: dto.clienteId,
                lugar: dto.lugar || client.direccion || '',
                descripcionTrabajo: dto.descripcionTrabajo.trim(),
                monto,
                fechaProgramada: new Date(dto.fechaProgramada),
                horario: dto.horario || null,
                estado: dto.estado || 'programado',
                sucursalId: dto.sucursalId,
                vendedorId: dto.vendedorId || (user.role.includes('VENTAS') ? user.id : null),
                tecnicoId: dto.tecnicoId || null,
                quotationId: dto.quotationId || null,
                projectId: options.projectId || null,
                observaciones: dto.observaciones || '',
                mapsLink: dto.mapsLink || '',
            },
            include,
        });
        if (adelanto > 0 && !options.projectId)
            await this.income.register({ scheduleId: row.id }, { concepto: 'adelanto', monto: adelanto, nota: 'Adelanto al crear el trabajo' }, user, sessionId);
        await this.prisma.touchClientActivity(dto.clienteId);
        await this.audit.record({
            user,
            sessionId,
            action: 'schedule.create',
            entity: 'schedule',
            id: row.id,
            affects: affectsOf(row),
            patch: { estado: row.estado },
        });
        return this.get(row.id, user);
    }
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateSchedules)(user);
        const current = await this.get(id, user);
        if ((0, roles_1.isTec)(user) && !(0, roles_1.isAdmin)(user)) {
            const keys = Object.keys(dto).filter((k) => dto[k] !== undefined);
            if (keys.some((k) => !['estado', 'observaciones', 'fechaFinalizacion', 'horario'].includes(k))) {
                throw new common_1.ForbiddenException('Técnico solo actualiza estado u observaciones');
            }
            if (dto.estado === 'cancelado' && current.estado !== 'cancelado')
                throw new common_1.ForbiddenException('El técnico inicia y termina; la cancelación la hace ventas o Gerencia');
        }
        if (dto.estado && dto.estado !== current.estado) {
            const transition = (0, schedules_rules_1.checkScheduleTransition)(current.estado, dto.estado);
            if (!transition.ok)
                throw new common_1.BadRequestException(transition.reason);
        }
        const montoError = (0, schedules_rules_1.montoChangeError)(current, dto.monto);
        if (montoError)
            throw new common_1.BadRequestException(montoError);
        const categoryError = (0, schedules_rules_1.categoryChangeError)(current, dto.categoriaId);
        if (categoryError)
            throw new common_1.BadRequestException(categoryError);
        if (dto.categoriaId !== undefined && dto.categoriaId !== current.categoriaId)
            await this.categories.assertDivision(dto.categoriaId);
        if (dto.adelanto !== undefined && Number(dto.adelanto) !== Number(current.adelanto)) {
            throw new common_1.BadRequestException('Registra el adelanto como un cobro del trabajo');
        }
        const row = await this.prisma.schedule
            .update({
            where: { id },
            data: {
                ...(dto.categoriaId !== undefined ? { categoriaId: dto.categoriaId } : {}),
                ...(dto.lugar !== undefined ? { lugar: dto.lugar } : {}),
                ...(dto.descripcionTrabajo ? { descripcionTrabajo: dto.descripcionTrabajo.trim() } : {}),
                ...(dto.monto !== undefined ? { monto: Number(dto.monto) } : {}),
                ...(dto.fechaProgramada ? { fechaProgramada: new Date(dto.fechaProgramada) } : {}),
                ...(dto.horario !== undefined ? { horario: dto.horario || null } : {}),
                ...(dto.vendedorId !== undefined ? { vendedorId: dto.vendedorId || null } : {}),
                ...(dto.tecnicoId !== undefined ? { tecnicoId: dto.tecnicoId || null } : {}),
                ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones } : {}),
                ...(dto.mapsLink !== undefined ? { mapsLink: dto.mapsLink } : {}),
                ...(dto.estado ? { estado: dto.estado } : {}),
                ...(dto.estado === 'terminado' || dto.fechaFinalizacion
                    ? { fechaFinalizacion: dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : new Date() }
                    : {}),
            },
            include,
        })
            .then(present);
        await this.prisma.touchClientActivity(current.clienteId);
        await this.audit.record({
            user,
            sessionId,
            action: dto.estado ? 'schedule.status' : 'schedule.update',
            entity: 'schedule',
            id,
            before: current,
            after: row,
            affects: affectsOf(row),
            patch: { estado: row.estado, saldo: row.saldo },
        });
        return row;
    }
    async updateStatus(id, dto, user, sessionId) {
        return this.update(id, { estado: dto.estado, fechaFinalizacion: dto.fechaFinalizacion }, user, sessionId);
    }
    async listPayments(scheduleId, user) {
        const job = await this.get(scheduleId, user);
        return job.movements.map((m) => ({
            id: m.id,
            tipo: m.concepto === 'adicional' ? 'extra_asistencia' : m.concepto,
            monto: m.monto,
            metodo: m.metodo,
            nota: m.nota,
            estado: m.estado,
            at: m.fecha,
        }));
    }
    async registerPayment(scheduleId, dto, user, sessionId) {
        (0, roles_1.assertCanMutateSchedules)(user);
        await this.get(scheduleId, user);
        const concepto = dto.tipo === 'extra_asistencia' ? 'adicional' : dto.tipo;
        await this.income.register({ scheduleId }, { concepto, monto: Number(dto.monto), metodo: dto.metodo, nota: dto.nota, recibidoPorId: dto.recibidoPorId, cuentaDestino: dto.cuentaDestino }, user, sessionId);
        return this.get(scheduleId, user);
    }
    createFirstJob(tx, data) {
        return tx.schedule.create({ data });
    }
    cancelOpenJobs(tx, projectId) {
        return tx.schedule.updateMany({
            where: { projectId, estado: { in: ['programado', 'en_proceso'] } },
            data: { estado: 'cancelado' },
        });
    }
};
exports.SchedulesService = SchedulesService;
exports.SchedulesService = SchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        categories_1.CategoriesService,
        finance_1.IncomeService])
], SchedulesService);
//# sourceMappingURL=schedules.service.js.map