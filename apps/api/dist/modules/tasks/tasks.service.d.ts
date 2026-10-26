import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { AuditService } from '../../common/audit/audit.service';
export declare class TasksService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
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
        cliente: {
            id: string;
            nombre: string;
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
        titulo: string;
        clienteId: string | null;
        estado: string;
        horario: string | null;
        plazo: Date | null;
        prioridad: string;
        descripcion: string | null;
        prioridadMotivo: string | null;
        scheduleId: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
        archivosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
    })[]>;
    summary(user: User): Promise<{
        mias: number;
        sinAsignar: number;
        vencidas: number;
    }>;
    private assertClient;
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
        cliente: {
            id: string;
            nombre: string;
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
        titulo: string;
        clienteId: string | null;
        estado: string;
        horario: string | null;
        plazo: Date | null;
        prioridad: string;
        descripcion: string | null;
        prioridadMotivo: string | null;
        scheduleId: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
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
        cliente: {
            id: string;
            nombre: string;
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
        titulo: string;
        clienteId: string | null;
        estado: string;
        horario: string | null;
        plazo: Date | null;
        prioridad: string;
        descripcion: string | null;
        prioridadMotivo: string | null;
        scheduleId: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
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
        cliente: {
            id: string;
            nombre: string;
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
        titulo: string;
        clienteId: string | null;
        estado: string;
        horario: string | null;
        plazo: Date | null;
        prioridad: string;
        descripcion: string | null;
        prioridadMotivo: string | null;
        scheduleId: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
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
        cliente: {
            id: string;
            nombre: string;
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
        titulo: string;
        clienteId: string | null;
        estado: string;
        horario: string | null;
        plazo: Date | null;
        prioridad: string;
        descripcion: string | null;
        prioridadMotivo: string | null;
        scheduleId: string | null;
        asignadoPorId: string | null;
        asignadoAt: Date | null;
        archivosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        completedAt: Date | null;
    }>;
    markConverted(id: string, cotizacionId: string, user: User, sessionId?: string): Promise<void>;
    assertConvertible(id: string, user: User): Promise<void>;
}
