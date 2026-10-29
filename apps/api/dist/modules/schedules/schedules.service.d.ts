import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateScheduleDto, CreateSchedulePaymentDto, ScheduleStatusDto, UpdateScheduleDto } from './dto/schedule.dto';
import { AuditService } from '../../common/audit/audit.service';
import { CategoriesService } from '../categories';
import { IncomeService } from '../finance';
type Tx = Prisma.TransactionClient;
export declare class SchedulesService {
    private readonly prisma;
    private readonly audit;
    private readonly categories;
    private readonly income;
    constructor(prisma: PrismaService, audit: AuditService, categories: CategoriesService, income: IncomeService);
    list(user: User, filters?: {
        estado?: string;
        sucursalId?: string;
        from?: string;
        to?: string;
        tecnicoId?: string;
        quotationId?: string;
        clienteId?: string;
    }): Promise<{
        project: {
            monto: number;
            cobrado: number;
            saldo: number;
            pctCobrado: number;
            id: string;
            estado: string;
            codigo: string;
        } | null;
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: Prisma.Decimal;
            numero: string;
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
        clienteId: string;
        categoriaId: string;
        monto: Prisma.Decimal;
        estado: string;
        vendedorId: string | null;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: Prisma.JsonValue | null;
    }[]>;
    get(id: string, user: User): Promise<{
        project: {
            monto: number;
            cobrado: number;
            saldo: number;
            pctCobrado: number;
            id: string;
            estado: string;
            codigo: string;
        } | null;
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: Prisma.Decimal;
            numero: string;
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
        clienteId: string;
        categoriaId: string;
        monto: Prisma.Decimal;
        estado: string;
        vendedorId: string | null;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: Prisma.JsonValue | null;
    }>;
    create(dto: CreateScheduleDto, user: User, sessionId?: string, options?: {
        projectId?: string;
    }): Promise<{
        project: {
            monto: number;
            cobrado: number;
            saldo: number;
            pctCobrado: number;
            id: string;
            estado: string;
            codigo: string;
        } | null;
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: Prisma.Decimal;
            numero: string;
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
        clienteId: string;
        categoriaId: string;
        monto: Prisma.Decimal;
        estado: string;
        vendedorId: string | null;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: Prisma.JsonValue | null;
    }>;
    update(id: string, dto: UpdateScheduleDto, user: User, sessionId?: string): Promise<{
        project: {
            monto: number;
            cobrado: number;
            saldo: number;
            pctCobrado: number;
            id: string;
            estado: string;
            codigo: string;
        } | null;
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: Prisma.Decimal;
            numero: string;
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
        clienteId: string;
        categoriaId: string;
        monto: Prisma.Decimal;
        estado: string;
        vendedorId: string | null;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: Prisma.JsonValue | null;
    }>;
    updateStatus(id: string, dto: ScheduleStatusDto, user: User, sessionId?: string): Promise<{
        project: {
            monto: number;
            cobrado: number;
            saldo: number;
            pctCobrado: number;
            id: string;
            estado: string;
            codigo: string;
        } | null;
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: Prisma.Decimal;
            numero: string;
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
        clienteId: string;
        categoriaId: string;
        monto: Prisma.Decimal;
        estado: string;
        vendedorId: string | null;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: Prisma.JsonValue | null;
    }>;
    listPayments(scheduleId: string, user: User): Promise<{
        id: string;
        tipo: string;
        monto: Prisma.Decimal;
        metodo: string;
        nota: string;
        estado: string;
        at: Date;
    }[]>;
    registerPayment(scheduleId: string, dto: CreateSchedulePaymentDto, user: User, sessionId?: string): Promise<{
        project: {
            monto: number;
            cobrado: number;
            saldo: number;
            pctCobrado: number;
            id: string;
            estado: string;
            codigo: string;
        } | null;
        adelanto: number;
        saldo: number;
        movements: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
            metodo: string;
            nota: string;
            concepto: string;
            fecha: Date;
        }[];
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
            createdAt: Date;
            updatedAt: Date;
        };
        quotation: {
            id: string;
            titulo: string;
            monto: Prisma.Decimal;
            numero: string;
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
        clienteId: string;
        categoriaId: string;
        monto: Prisma.Decimal;
        estado: string;
        vendedorId: string | null;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: Prisma.JsonValue | null;
    }>;
    createFirstJob(tx: Tx, data: Prisma.ScheduleUncheckedCreateInput): Prisma.Prisma__ScheduleClient<{
        id: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        createdAt: Date;
        updatedAt: Date;
        tecnicoId: string | null;
        clienteId: string;
        categoriaId: string;
        monto: Prisma.Decimal;
        estado: string;
        vendedorId: string | null;
        fechaProgramada: Date;
        lugar: string;
        horario: string | null;
        quotationId: string | null;
        descripcionTrabajo: string;
        fechaFinalizacion: Date | null;
        projectId: string | null;
        fotosUrl: Prisma.JsonValue | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    cancelOpenJobs(tx: Tx, projectId: string): Prisma.PrismaPromise<Prisma.BatchPayload>;
}
export {};
