import type { User } from '@prisma/client';
import { CreateScheduleDto, CreateSchedulePaymentDto, ScheduleStatusDto, UpdateScheduleDto } from './dto/schedule.dto';
import { SchedulesService } from './schedules.service';
export declare class SchedulesController {
    private readonly schedules;
    constructor(schedules: SchedulesService);
    list(user: User, estado?: string, sucursalId?: string, from?: string, to?: string, tecnicoId?: string, quotationId?: string, clienteId?: string): Promise<{
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            numero: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
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
            mapsLink: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        categoria: {
            id: string;
            label: string;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
        id: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        createdAt: Date;
        updatedAt: Date;
        tecnicoId: string | null;
        vendedorId: string | null;
        clienteId: string;
        categoriaId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    listPayments(id: string, user: User): Promise<{
        id: string;
        tipo: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        metodo: string;
        nota: string;
        estado: string;
        at: Date;
    }[]>;
    registerPayment(id: string, dto: CreateSchedulePaymentDto, user: User, sessionId?: string): Promise<{
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            numero: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
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
            mapsLink: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        categoria: {
            id: string;
            label: string;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
        id: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        createdAt: Date;
        updatedAt: Date;
        tecnicoId: string | null;
        vendedorId: string | null;
        clienteId: string;
        categoriaId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    get(id: string, user: User): Promise<{
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            numero: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
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
            mapsLink: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        categoria: {
            id: string;
            label: string;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
        id: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        createdAt: Date;
        updatedAt: Date;
        tecnicoId: string | null;
        vendedorId: string | null;
        clienteId: string;
        categoriaId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    create(dto: CreateScheduleDto, user: User, sessionId?: string): Promise<{
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            numero: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
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
            mapsLink: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        categoria: {
            id: string;
            label: string;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
        id: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        createdAt: Date;
        updatedAt: Date;
        tecnicoId: string | null;
        vendedorId: string | null;
        clienteId: string;
        categoriaId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    update(id: string, dto: UpdateScheduleDto, user: User, sessionId?: string): Promise<{
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            numero: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
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
            mapsLink: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        categoria: {
            id: string;
            label: string;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
        id: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        createdAt: Date;
        updatedAt: Date;
        tecnicoId: string | null;
        vendedorId: string | null;
        clienteId: string;
        categoriaId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    status(id: string, dto: ScheduleStatusDto, user: User, sessionId?: string): Promise<{
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            numero: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
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
            mapsLink: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        categoria: {
            id: string;
            label: string;
        };
        vendedor: {
            id: string;
            name: string;
        } | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
        id: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        createdAt: Date;
        updatedAt: Date;
        tecnicoId: string | null;
        vendedorId: string | null;
        clienteId: string;
        categoriaId: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
