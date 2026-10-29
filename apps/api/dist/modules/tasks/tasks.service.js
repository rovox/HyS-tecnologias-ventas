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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const roles_1 = require("../../common/policy/roles");
const audit_service_1 = require("../../common/audit/audit.service");
const tasks_rules_1 = require("./domain/tasks.rules");
const TASK_INCLUDE = {
    creador: { select: { id: true, name: true } },
    asignado: { select: { id: true, name: true } },
    sucursal: { select: { id: true, nombre: true } },
    quotation: { select: { id: true, numero: true } },
    cliente: { select: { id: true, nombre: true } },
};
function titleFromDescription(text) {
    const line = String(text || '').trim().split(/\n/)[0] || '';
    return line.slice(0, 200);
}
const DAY_MS = 24 * 60 * 60 * 1000;
let TasksService = TasksService_1 = class TasksService {
    prisma;
    audit;
    logger = new common_1.Logger(TasksService_1.name);
    purgeTimer;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    startTimers() {
        const run = () => this.purgeArchived().catch((err) => this.logger.error(`Purga de tareas archivadas: ${err}`));
        run();
        this.purgeTimer = setInterval(run, DAY_MS);
        this.purgeTimer.unref();
    }
    onModuleDestroy() {
        clearInterval(this.purgeTimer);
    }
    async purgeArchived(now = new Date()) {
        const { count } = await this.prisma.task.deleteMany({ where: { archivadaAt: { lt: (0, tasks_rules_1.purgeBefore)(now) } } });
        if (count)
            this.logger.log(`${count} tareas archivadas hace más de 30 días eliminadas`);
        return count;
    }
    async list(user, tipo, archivadas = false) {
        const rows = await this.prisma.task.findMany({
            where: { ...(0, roles_1.taskWhere)(user, tipo), ...(archivadas ? { archivadaAt: { not: null } } : { estado: 'pendiente' }) },
            include: TASK_INCLUDE,
            ...(archivadas ? { orderBy: { archivadaAt: 'desc' }, take: 200 } : {}),
        });
        return archivadas ? rows : rows.sort(tasks_rules_1.compareTasks);
    }
    async summary(user) {
        const rows = await this.prisma.task.findMany({
            where: { ...(0, roles_1.taskWhere)(user), estado: 'pendiente' },
            select: { estado: true, prioridad: true, plazo: true, asignadoId: true, creadorId: true },
        });
        return (0, tasks_rules_1.pendingSummary)(rows, user.id, new Date());
    }
    async assertClient(id) {
        if (!id)
            return;
        const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
        if (!client)
            throw new common_1.BadRequestException('Cliente no encontrado');
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
        const sucursalId = dto.sucursalId || user.sucursalId;
        if (!sucursalId)
            throw new common_1.BadRequestException('Sucursal requerida');
        const descripcion = dto.descripcion?.trim() || null;
        const titulo = (dto.titulo?.trim() || titleFromDescription(descripcion)).trim();
        if (!titulo)
            throw new common_1.BadRequestException('La descripción de la tarea es requerida');
        const assigned = Boolean(dto.asignadoId);
        await this.assertClient(dto.clienteId);
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
                clienteId: dto.clienteId || null,
                estado: 'pendiente',
            },
        });
        await this.audit.record({ user, sessionId, action: 'task.create', entity: 'task', id: row.id, patch: { estado: 'pendiente' } });
        return this.get(row.id, user);
    }
    async update(id, dto, user, sessionId) {
        const current = await this.get(id, user);
        const canMutate = (0, roles_1.isAdmin)(user) || (0, roles_1.isVentas)(user) || current.creadorId === user.id || current.asignadoId === user.id;
        if (!canMutate)
            throw new common_1.ForbiddenException('No puedes editar esta tarea');
        if (dto.clienteId)
            await this.assertClient(dto.clienteId);
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
                ...(dto.clienteId !== undefined ? { clienteId: dto.clienteId || null } : {}),
                ...(dto.estado ? { estado: dto.estado, archivadaAt: (0, tasks_rules_1.archivedAtFor)(dto.estado, new Date()) } : {}),
                ...(completing ? { completedAt: new Date() } : {}),
                ...(dto.estado && dto.estado !== 'completada' ? { completedAt: null } : {}),
            },
        });
        await this.audit.record({
            user,
            sessionId,
            action: completing ? 'task.complete' : 'task.update',
            entity: 'task',
            id,
            before: current,
            after: row,
            patch: { estado: row.estado, prioridad: row.prioridad },
        });
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
        await this.audit.record({ user, sessionId, action: 'task.claim', entity: 'task', id, patch: { asignadoId: user.id } });
        return this.get(id, user);
    }
    async markConverted(id, cotizacionId, user, sessionId) {
        const current = await this.get(id, user);
        const error = (0, tasks_rules_1.convertError)(current);
        if (error)
            throw new common_1.BadRequestException(error);
        const row = await this.prisma.task.update({
            where: { id },
            data: { cotizacionId, estado: 'completada', completedAt: new Date(), archivadaAt: new Date() },
        });
        await this.audit.record({ user, sessionId, action: 'task.convert', entity: 'task', id, before: current, after: row, affects: ['quotation'] });
    }
    async assertConvertible(id, user) {
        const error = (0, tasks_rules_1.convertError)(await this.get(id, user));
        if (error)
            throw new common_1.BadRequestException(error);
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map