import type { User } from '@prisma/client';
import { CreateScheduleDto, CreateSchedulePaymentDto, ScheduleStatusDto, UpdateScheduleDto } from './dto/schedule.dto';
import { SchedulesService } from './schedules.service';
export declare class SchedulesController {
    private readonly schedules;
    constructor(schedules: SchedulesService);
    list(user: User, estado?: string, sucursalId?: string, from?: string, to?: string, tecnicoId?: string, quotationId?: string, clienteId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            numero: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        } | null;
        payments: {
            at: Date;
            id: string;
            tipo: string;
            createdAt: Date;
            quotationId: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            scheduleId: string | null;
            metodo: string;
            nota: string;
            relevamientoId: string | null;
            cobradoPorId: string | null;
        }[];
        cliente: {
            id: string;
            nombre: string;
            tipo: string;
            contacto: string;
            email: string;
            telefono: string;
            direccion: string;
            sucursalId: string;
            observaciones: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        tecnicoId: string | null;
        vendedorId: string | null;
        quotationId: string | null;
        estado: string;
        clienteId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        lugar: string;
        descripcionTrabajo: string;
        adelanto: import("@prisma/client/runtime/library").Decimal;
        saldo: import("@prisma/client/runtime/library").Decimal;
        fechaProgramada: Date;
        horario: string | null;
        fechaFinalizacion: Date | null;
        mapsLink: string;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    listPayments(id: string, user: User): Promise<{
        at: Date;
        id: string;
        tipo: string;
        createdAt: Date;
        quotationId: string | null;
        monto: import("@prisma/client/runtime/library").Decimal;
        scheduleId: string | null;
        metodo: string;
        nota: string;
        relevamientoId: string | null;
        cobradoPorId: string | null;
    }[]>;
    registerPayment(id: string, dto: CreateSchedulePaymentDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            numero: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        } | null;
        payments: {
            at: Date;
            id: string;
            tipo: string;
            createdAt: Date;
            quotationId: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            scheduleId: string | null;
            metodo: string;
            nota: string;
            relevamientoId: string | null;
            cobradoPorId: string | null;
        }[];
        cliente: {
            id: string;
            nombre: string;
            tipo: string;
            contacto: string;
            email: string;
            telefono: string;
            direccion: string;
            sucursalId: string;
            observaciones: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        tecnicoId: string | null;
        vendedorId: string | null;
        quotationId: string | null;
        estado: string;
        clienteId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        lugar: string;
        descripcionTrabajo: string;
        adelanto: import("@prisma/client/runtime/library").Decimal;
        saldo: import("@prisma/client/runtime/library").Decimal;
        fechaProgramada: Date;
        horario: string | null;
        fechaFinalizacion: Date | null;
        mapsLink: string;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    get(id: string, user: User): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            numero: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        } | null;
        payments: {
            at: Date;
            id: string;
            tipo: string;
            createdAt: Date;
            quotationId: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            scheduleId: string | null;
            metodo: string;
            nota: string;
            relevamientoId: string | null;
            cobradoPorId: string | null;
        }[];
        cliente: {
            id: string;
            nombre: string;
            tipo: string;
            contacto: string;
            email: string;
            telefono: string;
            direccion: string;
            sucursalId: string;
            observaciones: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        tecnicoId: string | null;
        vendedorId: string | null;
        quotationId: string | null;
        estado: string;
        clienteId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        lugar: string;
        descripcionTrabajo: string;
        adelanto: import("@prisma/client/runtime/library").Decimal;
        saldo: import("@prisma/client/runtime/library").Decimal;
        fechaProgramada: Date;
        horario: string | null;
        fechaFinalizacion: Date | null;
        mapsLink: string;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(dto: CreateScheduleDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            numero: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        } | null;
        payments: {
            at: Date;
            id: string;
            tipo: string;
            createdAt: Date;
            quotationId: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            scheduleId: string | null;
            metodo: string;
            nota: string;
            relevamientoId: string | null;
            cobradoPorId: string | null;
        }[];
        cliente: {
            id: string;
            nombre: string;
            tipo: string;
            contacto: string;
            email: string;
            telefono: string;
            direccion: string;
            sucursalId: string;
            observaciones: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        tecnicoId: string | null;
        vendedorId: string | null;
        quotationId: string | null;
        estado: string;
        clienteId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        lugar: string;
        descripcionTrabajo: string;
        adelanto: import("@prisma/client/runtime/library").Decimal;
        saldo: import("@prisma/client/runtime/library").Decimal;
        fechaProgramada: Date;
        horario: string | null;
        fechaFinalizacion: Date | null;
        mapsLink: string;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, dto: UpdateScheduleDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            numero: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        } | null;
        payments: {
            at: Date;
            id: string;
            tipo: string;
            createdAt: Date;
            quotationId: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            scheduleId: string | null;
            metodo: string;
            nota: string;
            relevamientoId: string | null;
            cobradoPorId: string | null;
        }[];
        cliente: {
            id: string;
            nombre: string;
            tipo: string;
            contacto: string;
            email: string;
            telefono: string;
            direccion: string;
            sucursalId: string;
            observaciones: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        tecnicoId: string | null;
        vendedorId: string | null;
        quotationId: string | null;
        estado: string;
        clienteId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        lugar: string;
        descripcionTrabajo: string;
        adelanto: import("@prisma/client/runtime/library").Decimal;
        saldo: import("@prisma/client/runtime/library").Decimal;
        fechaProgramada: Date;
        horario: string | null;
        fechaFinalizacion: Date | null;
        mapsLink: string;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    status(id: string, dto: ScheduleStatusDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            numero: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
        } | null;
        payments: {
            at: Date;
            id: string;
            tipo: string;
            createdAt: Date;
            quotationId: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            scheduleId: string | null;
            metodo: string;
            nota: string;
            relevamientoId: string | null;
            cobradoPorId: string | null;
        }[];
        cliente: {
            id: string;
            nombre: string;
            tipo: string;
            contacto: string;
            email: string;
            telefono: string;
            direccion: string;
            sucursalId: string;
            observaciones: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string;
        createdAt: Date;
        updatedAt: Date;
        type: string;
        tecnicoId: string | null;
        vendedorId: string | null;
        quotationId: string | null;
        estado: string;
        clienteId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        lugar: string;
        descripcionTrabajo: string;
        adelanto: import("@prisma/client/runtime/library").Decimal;
        saldo: import("@prisma/client/runtime/library").Decimal;
        fechaProgramada: Date;
        horario: string | null;
        fechaFinalizacion: Date | null;
        mapsLink: string;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
