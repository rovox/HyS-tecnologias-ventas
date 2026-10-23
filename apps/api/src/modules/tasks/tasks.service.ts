import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { isAdmin, isVentas, taskWhere } from '../../common/policy/roles';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { AuditService } from '../../common/audit/audit.service';
import { compareTasks, convertError, pendingSummary } from './domain/tasks.rules';

const TASK_INCLUDE = {
  creador: { select: { id: true, name: true } },
  asignado: { select: { id: true, name: true } },
  sucursal: { select: { id: true, nombre: true } },
  quotation: { select: { id: true, numero: true } },
  cliente: { select: { id: true, nombre: true } },
} as const;

function titleFromDescription(text?: string | null) {
  const line = String(text || '').trim().split(/\n/)[0] || '';
  return line.slice(0, 200);
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Pending tasks plus the ones closed in the last 24 h (so a just-completed task does not vanish at once). */
  async list(user: User, tipo?: string) {
    const hace24 = new Date();
    hace24.setHours(hace24.getHours() - 24);
    const rows = await this.prisma.task.findMany({
      where: {
        ...taskWhere(user, tipo),
        OR: [{ estado: 'pendiente' }, { estado: { not: 'pendiente' }, updatedAt: { gte: hace24 } }],
      },
      include: TASK_INCLUDE,
    });
    return rows.sort(compareTasks);
  }

  /** Counters for the always-visible tasks badge. */
  async summary(user: User) {
    const rows = await this.prisma.task.findMany({
      where: { ...taskWhere(user), estado: 'pendiente' },
      select: { estado: true, prioridad: true, plazo: true, asignadoId: true, creadorId: true },
    });
    return pendingSummary(rows, user.id, new Date());
  }

  private async assertClient(id?: string | null) {
    if (!id) return;
    const client = await this.prisma.client.findUnique({ where: { id }, select: { id: true } });
    if (!client) throw new BadRequestException('Cliente no encontrado');
  }

  async get(id: string, user: User) {
    const row = await this.prisma.task.findFirst({
      where: { id, ...taskWhere(user) },
      include: TASK_INCLUDE,
    });
    if (!row) throw new NotFoundException('Tarea no encontrada');
    return row;
  }

  async create(dto: CreateTaskDto, user: User, sessionId?: string) {
    const sucursalId = dto.sucursalId || user.sucursalId;
    if (!sucursalId) throw new BadRequestException('Sucursal requerida');
    const descripcion = dto.descripcion?.trim() || null;
    const titulo = (dto.titulo?.trim() || titleFromDescription(descripcion)).trim();
    if (!titulo) throw new BadRequestException('La descripción de la tarea es requerida');
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

  async update(id: string, dto: UpdateTaskDto, user: User, sessionId?: string) {
    const current = await this.get(id, user);
    const canMutate = isAdmin(user) || isVentas(user) || current.creadorId === user.id || current.asignadoId === user.id;
    if (!canMutate) throw new ForbiddenException('No puedes editar esta tarea');
    if (dto.clienteId) await this.assertClient(dto.clienteId);
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
        ...(dto.estado ? { estado: dto.estado } : {}),
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

  async claim(id: string, user: User, sessionId?: string) {
    if (!isAdmin(user) && !isVentas(user)) {
      throw new ForbiddenException('Solo ventas o admin pueden reclamar');
    }
    const current = await this.get(id, user);
    if (current.asignadoId) {
      throw new ConflictException('Esta tarea ya tiene encargado');
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

  /** Called by quotations when a task becomes a quotation: links it and completes it. */
  async markConverted(id: string, cotizacionId: string, user: User, sessionId?: string) {
    const current = await this.get(id, user);
    const error = convertError(current);
    if (error) throw new BadRequestException(error);
    const row = await this.prisma.task.update({
      where: { id },
      data: { cotizacionId, estado: 'completada', completedAt: new Date() },
    });
    await this.audit.record({ user, sessionId, action: 'task.convert', entity: 'task', id, before: current, after: row, affects: ['quotation'] });
  }

  /** Fails early (before the quotation is created) when the task cannot be converted. */
  async assertConvertible(id: string, user: User) {
    const error = convertError(await this.get(id, user));
    if (error) throw new BadRequestException(error);
  }
}
