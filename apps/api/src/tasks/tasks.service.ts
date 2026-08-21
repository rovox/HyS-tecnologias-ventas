import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { isAdmin, isCont, taskWhere } from '../auth/roles';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

const PRIORIDAD = { alta: 0, media: 1, baja: 2 };

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async list(user: User) {
    if (isCont(user)) throw new ForbiddenException('Sin acceso a tareas');
    const hace24 = new Date();
    hace24.setHours(hace24.getHours() - 24);
    const rows = await this.prisma.task.findMany({
      where: {
        ...taskWhere(user),
        OR: [
          { estado: { not: 'completada' } },
          { estado: 'completada', completedAt: { gte: hace24 } },
        ],
      },
      include: {
        creador: { select: { id: true, name: true } },
        asignado: { select: { id: true, name: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
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
      include: {
        creador: { select: { id: true, name: true } },
        asignado: { select: { id: true, name: true } },
        sucursal: { select: { id: true, nombre: true } },
      },
    });
    if (!row) throw new NotFoundException('Tarea no encontrada');
    return row;
  }

  async create(dto: CreateTaskDto, user: User, sessionId?: string) {
    if (isCont(user)) throw new ForbiddenException('Sin acceso a tareas');
    const sucursalId = dto.sucursalId || user.sucursalId;
    if (!sucursalId) throw new BadRequestException('Sucursal requerida');
    const row = await this.prisma.task.create({
      data: {
        titulo: dto.titulo.trim(),
        descripcion: dto.descripcion || null,
        sucursalId,
        creadorId: user.id,
        asignadoId: dto.asignadoId || null,
        prioridad: dto.prioridad || 'media',
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
    const canMutate = isAdmin(user) || current.creadorId === user.id || current.asignadoId === user.id;
    if (!canMutate) throw new ForbiddenException('No puedes editar esta tarea');
    const completing = dto.estado === 'completada' && current.estado !== 'completada';
    const row = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.titulo ? { titulo: dto.titulo.trim() } : {}),
        ...(dto.descripcion !== undefined ? { descripcion: dto.descripcion } : {}),
        ...(dto.asignadoId !== undefined ? { asignadoId: dto.asignadoId || null } : {}),
        ...(dto.prioridad ? { prioridad: dto.prioridad } : {}),
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
    return row;
  }
}
