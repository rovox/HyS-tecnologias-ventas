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
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
const FLOW = {
    programado: ['en_proceso', 'cancelado'],
    en_proceso: ['terminado', 'cancelado'],
    terminado: [],
    cancelado: [],
};
const include = {
    cliente: true,
    sucursal: true,
    vendedor: { select: { id: true, name: true } },
    tecnico: { select: { id: true, name: true } },
    quotation: { select: { id: true, numero: true, titulo: true } },
};
let SchedulesService = class SchedulesService {
    prisma;
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    saldo(monto, adelanto) {
        return Math.max(0, Number(monto) - Number(adelanto));
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
        });
    }
    async get(id, user) {
        const row = await this.prisma.schedule.findFirst({
            where: { id, ...(0, roles_1.scheduleWhere)(user) },
            include,
        });
        if (!row)
            throw new common_1.NotFoundException('Trabajo no encontrado');
        return row;
    }
    async create(dto, user, sessionId) {
        (0, roles_1.assertCanCreateSchedules)(user);
        const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
        if (!client)
            throw new common_1.BadRequestException('Cliente no encontrado');
        const sucursal = await this.prisma.sucursal.findUnique({ where: { id: dto.sucursalId } });
        if (!sucursal)
            throw new common_1.BadRequestException('Sucursal no válida');
        if (dto.quotationId) {
            const quote = await this.prisma.quotation.findUnique({ where: { id: dto.quotationId } });
            if (!quote)
                throw new common_1.BadRequestException('Cotización no encontrada');
        }
        const monto = Number(dto.monto ?? 0);
        const adelanto = Number(dto.adelanto ?? 0);
        const row = await this.prisma.schedule.create({
            data: {
                type: dto.type,
                clienteId: dto.clienteId,
                lugar: dto.lugar || client.direccion || '',
                descripcionTrabajo: dto.descripcionTrabajo.trim(),
                monto,
                adelanto,
                saldo: this.saldo(monto, adelanto),
                fechaProgramada: new Date(dto.fechaProgramada),
                horario: dto.horario || null,
                estado: dto.estado || 'programado',
                sucursalId: dto.sucursalId,
                vendedorId: dto.vendedorId || (user.role.includes('VENTAS') ? user.id : null),
                tecnicoId: dto.tecnicoId || null,
                quotationId: dto.quotationId || null,
                observaciones: dto.observaciones || '',
                mapsLink: dto.mapsLink || '',
            },
            include,
        });
        await this.prisma.touchClientActivity(dto.clienteId);
        await this.activity.log(user.id, sessionId, 'schedule.create', 'schedule', row.id);
        return row;
    }
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateSchedules)(user);
        const current = await this.get(id, user);
        if ((0, roles_1.isTec)(user) && !(0, roles_1.isAdmin)(user)) {
            const allowed = ['estado', 'observaciones', 'fechaFinalizacion', 'horario'].filter((key) => dto[key] !== undefined);
            const keys = Object.keys(dto).filter((k) => dto[k] !== undefined);
            if (keys.some((k) => !['estado', 'observaciones', 'fechaFinalizacion', 'horario'].includes(k))) {
                throw new common_1.ForbiddenException('Técnico solo actualiza estado u observaciones');
            }
            void allowed;
        }
        if (dto.estado && dto.estado !== current.estado) {
            const allowed = FLOW[current.estado] || [];
            if (!allowed.includes(dto.estado)) {
                throw new common_1.BadRequestException(`Transición inválida: ${current.estado} → ${dto.estado}`);
            }
        }
        const monto = dto.monto !== undefined ? Number(dto.monto) : Number(current.monto);
        const adelanto = dto.adelanto !== undefined ? Number(dto.adelanto) : Number(current.adelanto);
        const row = await this.prisma.schedule.update({
            where: { id },
            data: {
                ...(dto.lugar !== undefined ? { lugar: dto.lugar } : {}),
                ...(dto.descripcionTrabajo ? { descripcionTrabajo: dto.descripcionTrabajo.trim() } : {}),
                ...(dto.monto !== undefined ? { monto } : {}),
                ...(dto.adelanto !== undefined ? { adelanto } : {}),
                ...(dto.monto !== undefined || dto.adelanto !== undefined ? { saldo: this.saldo(monto, adelanto) } : {}),
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
        });
        await this.prisma.touchClientActivity(current.clienteId);
        await this.activity.log(user.id, sessionId, 'schedule.update', 'schedule', id);
        return row;
    }
    async updateStatus(id, dto, user, sessionId) {
        return this.update(id, { estado: dto.estado, fechaFinalizacion: dto.fechaFinalizacion }, user, sessionId);
    }
};
exports.SchedulesService = SchedulesService;
exports.SchedulesService = SchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], SchedulesService);
//# sourceMappingURL=schedules.service.js.map