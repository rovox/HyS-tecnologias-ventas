import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { isAdmin, isCont, isVentas, taskWhere } from '../auth/roles';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

const PRIORIDAD = { alta: 0, media: 1, baja: 2 };

const TASK_INCLUDE = {
  creador: { select: { id: true, name: true } },
  asignado: { select: { id: true, name: true } },
  sucursal: { select: { id: true, nombre: true } },
  quotation: { select: { id: true, numero: true } },
} as const;

function titleFromDescription(text?: string | null) {
  const line = String(text || '').trim().split(/\n/)[0] || '';
  return line.slice(0, 200);
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async list(user: User, tipo?: string) {
    if (isCont(user)) throw new ForbiddenException('Sin acceso a tareas');
    const hace24 = new Date();
    hace24.setHours(hace24.getHours() - 24);
    const rows = await this.prisma.task.findMany({
      where: {
        ...taskWhere(user, tipo),
        OR: [
          { estado: { not: 'completada' } },
          { estado: 'completada', completedAt: { gte: hace24 } },
        ],
      },
      include: TASK_INCLUDE,
    });
    return rows.sort((a, b) => {
      const pa = PRIORIDAD[a.prioridad as keyof typeof PRIORIDAD] ?? 9;
      const pb = PRIORIDAD[b.prioridad as keyof typeof PRIORIDAD] ?? 9;
      if (pa !== pb) return pa - pb;
      const ta = a.plazo ? new Date(a.plazo).getTime() : Infinity;
      const tb = b.plazo ? new Date(b.plazo).getTime() : Infinity;
      return ta - tb;
    });
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
    if (isCont(user)) throw new ForbiddenException('Sin acceso a tareas');
    const sucursalId = dto.sucursalId || user.sucursalId;
    if (!sucursalId) throw new BadRequestException('Sucursal requerida');
    const descripcion = dto.descripcion?.trim() || null;
    const titulo = (dto.titulo?.trim() || titleFromDescription(descripcion)).trim();
    if (!titulo) throw new BadRequestException('La descripción de la tarea es requerida');
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

  async update(id: string, dto: UpdateTaskDto, user: User, sessionId?: string) {
    const current = await this.get(id, user);
    const canMutate = isAdmin(user) || isVentas(user) || current.creadorId === user.id || current.asignadoId === user.id;
    if (!canMutate) throw new ForbiddenException('No puedes editar esta tarea');
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
    await this.activity.log(user.id, sessionId, 'task.claim', 'task', id);
    return this.get(id, user);
  }
}
