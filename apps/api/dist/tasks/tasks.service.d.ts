import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
export declare class TasksService {
    private readonly prisma;
    private readonly activity;
    constructor(prisma: PrismaService, activity: ActivityService);
    list(user: User, tipo?: string): Promise<({
        sucursal: {
            id: string;
            nombre: string;
        };
        quotation: {
            id: string;
            numero: string;
        } | null;
        creador: {
            id: string;
            name: string;
        };
        asignado: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        tipo: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        cotizacionId: string | null;
        creadorId: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        horario: string | null;
        descripcion: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
        prioridad: string;
        prioridadMotivo: string | null;
        plazo: Date | null;
        scheduleId: string | null;
        archivosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
    })[]>;
    get(id: string, user: User): Promise<{
        sucursal: {
            id: string;
            nombre: string;
        };
        quotation: {
            id: string;
            numero: string;
        } | null;
        creador: {
            id: string;
            name: string;
        };
        asignado: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        tipo: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        cotizacionId: string | null;
        creadorId: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        horario: string | null;
        descripcion: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
        prioridad: string;
        prioridadMotivo: string | null;
        plazo: Date | null;
        scheduleId: string | null;
        archivosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
    }>;
    create(dto: CreateTaskDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
        };
        quotation: {
            id: string;
            numero: string;
        } | null;
        creador: {
            id: string;
            name: string;
        };
        asignado: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        tipo: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        cotizacionId: string | null;
        creadorId: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        horario: string | null;
        descripcion: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
        prioridad: string;
        prioridadMotivo: string | null;
        plazo: Date | null;
        scheduleId: string | null;
        archivosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
    }>;
    update(id: string, dto: UpdateTaskDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
        };
        quotation: {
            id: string;
            numero: string;
        } | null;
        creador: {
            id: string;
            name: string;
        };
        asignado: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        tipo: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        cotizacionId: string | null;
        creadorId: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        horario: string | null;
        descripcion: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
        prioridad: string;
        prioridadMotivo: string | null;
        plazo: Date | null;
        scheduleId: string | null;
        archivosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
    }>;
    claim(id: string, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
        };
        quotation: {
            id: string;
            numero: string;
        } | null;
        creador: {
            id: string;
            name: string;
        };
        asignado: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        tipo: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        cotizacionId: string | null;
        creadorId: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        horario: string | null;
        descripcion: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
        prioridad: string;
        prioridadMotivo: string | null;
        plazo: Date | null;
        scheduleId: string | null;
        archivosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
    }>;
}
