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
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
const PRIORIDAD = { alta: 0, media: 1, baja: 2 };
const TASK_INCLUDE = {
    creador: { select: { id: true, name: true } },
    asignado: { select: { id: true, name: true } },
    sucursal: { select: { id: true, nombre: true } },
    quotation: { select: { id: true, numero: true } },
};
function titleFromDescription(text) {
    const line = String(text || '').trim().split(/\n/)[0] || '';
    return line.slice(0, 200);
}
let TasksService = class TasksService {
    prisma;
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    async list(user, tipo) {
        if ((0, roles_1.isCont)(user))
            throw new common_1.ForbiddenException('Sin acceso a tareas');
        const hace24 = new Date();
        hace24.setHours(hace24.getHours() - 24);
        const rows = await this.prisma.task.findMany({
            where: {
                ...(0, roles_1.taskWhere)(user, tipo),
                OR: [
                    { estado: { not: 'completada' } },
                    { estado: 'completada', completedAt: { gte: hace24 } },
                ],
            },
            include: TASK_INCLUDE,
        });
        return rows.sort((a, b) => {
            const pa = PRIORIDAD[a.prioridad] ?? 9;
            const pb = PRIORIDAD[b.prioridad] ?? 9;
            if (pa !== pb)
                return pa - pb;
            const ta = a.plazo ? new Date(a.plazo).getTime() : Infinity;
            const tb = b.plazo ? new Date(b.plazo).getTime() : Infinity;
            return ta - tb;
        });
    }
    async get(id, user) {
        const row = await this.prisma.task.findFirst({
            where: { id, ...(0, roles_1.taskWhere)(user) },
            include: TASK_INCLUDE,
        });
        if (!row)
            throw new common_1.NotFoundException('Tarea no encontrada');
        return row;
    }
    async create(dto, user, sessionId) {
        if ((0, roles_1.isCont)(user))
            throw new common_1.ForbiddenException('Sin acceso a tareas');
        const sucursalId = dto.sucursalId || user.sucursalId;
        if (!sucursalId)
            throw new common_1.BadRequestException('Sucursal requerida');
        const descripcion = dto.descripcion?.trim() || null;
        const titulo = (dto.titulo?.trim() || titleFromDescription(descripcion)).trim();
        if (!titulo)
            throw new common_1.BadRequestException('La descripción de la tarea es requerida');
        const assigned = Boolean(dto.asignadoId);
        const row = await this.prisma.task.create({
            data: {
                titulo,
                descripcion,
                tipo: dto.tipo || 'operativa',
                sucursalId,
                creadorId: user.id,
                asignadoId: dto.asignadoId || null,
                asignadoPorId: assigned ? user.id : null,
                asignadoAt: assigned ? new Date() : null,
                prioridad: dto.prioridad || 'media',
                prioridadMotivo: dto.prioridadMotivo || null,
                plazo: dto.plazo ? new Date(dto.plazo) : null,
                horario: dto.horario || null,
                cotizacionId: dto.cotizacionId || null,
                scheduleId: dto.scheduleId || null,
                estado: 'pendiente',
            },
        });
        await this.activity.log(user.id, sessionId, 'task.create', 'task', row.id);
        return this.get(row.id, user);
    }
    async update(id, dto, user, sessionId) {
        const current = await this.get(id, user);
        const canMutate = (0, roles_1.isAdmin)(user) || (0, roles_1.isVentas)(user) || current.creadorId === user.id || current.asignadoId === user.id;
        if (!canMutate)
            throw new common_1.ForbiddenException('No puedes editar esta tarea');
        const completing = dto.estado === 'completada' && current.estado !== 'completada';
        const assigning = dto.asignadoId !== undefined && dto.asignadoId && dto.asignadoId !== current.asignadoId;
        const clearing = dto.asignadoId !== undefined && !dto.asignadoId;
        const row = await this.prisma.task.update({
            where: { id },
            data: {
                ...(dto.titulo ? { titulo: dto.titulo.trim() } : {}),
                ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
                ...(dto.asignadoId !== undefined ? { asignadoId: dto.asignadoId || null } : {}),
                ...(assigning ? { asignadoPorId: user.id, asignadoAt: new Date() } : {}),
                ...(clearing ? { asignadoPorId: null, asignadoAt: null } : {}),
                ...(dto.prioridad ? { prioridad: dto.prioridad } : {}),
                ...(dto.prioridadMotivo !== undefined ? { prioridadMotivo: dto.prioridadMotivo || null } : {}),
                ...(dto.plazo !== undefined ? { plazo: dto.plazo ? new Date(dto.plazo) : null } : {}),
                ...(dto.horario !== undefined ? { horario: dto.horario || null } : {}),
                ...(dto.cotizacionId !== undefined ? { cotizacionId: dto.cotizacionId || null } : {}),
                ...(dto.scheduleId !== undefined ? { scheduleId: dto.scheduleId || null } : {}),
                ...(dto.estado ? { estado: dto.estado } : {}),
                ...(completing ? { completedAt: new Date() } : {}),
                ...(dto.estado && dto.estado !== 'completada' ? { completedAt: null } : {}),
            },
        });
        await this.activity.log(user.id, sessionId, completing ? 'task.complete' : 'task.update', 'task', id);
        return this.get(id, user);
    }
    async claim(id, user, sessionId) {
        if (!(0, roles_1.isAdmin)(user) && !(0, roles_1.isVentas)(user)) {
            throw new common_1.ForbiddenException('Solo ventas o admin pueden reclamar');
        }
        const current = await this.get(id, user);
        if (current.asignadoId) {
            throw new common_1.ConflictException('Esta tarea ya tiene encargado');
        }
        await this.prisma.task.update({
            where: { id },
            data: {
                asignadoId: user.id,
                asignadoPorId: user.id,
                asignadoAt: new Date(),
            },
        });
        await this.activity.log(user.id, sessionId, 'task.claim', 'task', id);
        return this.get(id, user);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map