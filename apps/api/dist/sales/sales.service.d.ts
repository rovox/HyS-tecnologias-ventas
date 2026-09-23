import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { CreateJobDto, CreatePaymentDto } from './dto/sales.dto';
export declare class SalesService {
    private readonly prisma;
    private readonly activity;
    constructor(prisma: PrismaService, activity: ActivityService);
    list(user: User): import("@prisma/client").Prisma.PrismaPromise<({
        quotation: {
            id: string;
            sucursalId: string;
            createdAt: Date;
            updatedAt: Date;
            vendedorId: string;
            estado: string;
            numero: string;
            titulo: string;
            categoria: string;
            categoriaId: string;
            subcategoria: string;
            sucursalNombre: string;
            clienteId: string | null;
            motivoRechazo: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            observacion: string;
            archivo: string;
            archivoPdfUrl: string;
            tieneLicitacion: boolean;
            licitacionNumero: string | null;
            licitacionEntidad: string | null;
            plazoFinal: Date | null;
            fechaEnvio: Date | null;
            licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
        };
        jobs: {
            id: string;
            asignadoId: string | null;
            estado: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saleId: string;
        }[];
        payments: {
            at: Date;
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saleId: string;
            metodo: string;
            nota: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        quotationId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: string;
    })[]>;
    get(id: string, user?: User): Promise<{
        cobrado: number;
        saldo: number;
        quotation: {
            id: string;
            sucursalId: string;
            createdAt: Date;
            updatedAt: Date;
            vendedorId: string;
            estado: string;
            numero: string;
            titulo: string;
            categoria: string;
            categoriaId: string;
            subcategoria: string;
            sucursalNombre: string;
            clienteId: string | null;
            motivoRechazo: string | null;
            monto: import("@prisma/client/runtime/library").Decimal;
            observacion: string;
            archivo: string;
            archivoPdfUrl: string;
            tieneLicitacion: boolean;
            licitacionNumero: string | null;
            licitacionEntidad: string | null;
            plazoFinal: Date | null;
            fechaEnvio: Date | null;
            licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
        };
        jobs: {
            id: string;
            asignadoId: string | null;
            estado: string;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saleId: string;
        }[];
        payments: {
            at: Date;
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            saleId: string;
            metodo: string;
            nota: string;
        }[];
        id: string;
        createdAt: Date;
        quotationId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: string;
    }>;
    addJob(saleId: string, dto: CreateJobDto, user: User, sessionId?: string): Promise<{
        id: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        saleId: string;
    }>;
    updateJob(saleId: string, jobId: string, estado: string, user: User, sessionId?: string): Promise<{
        id: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        saleId: string;
    }>;
    addPayment(saleId: string, dto: CreatePaymentDto, user: User, sessionId?: string): Promise<{
        at: Date;
        id: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        saleId: string;
        metodo: string;
        nota: string;
    }>;
}
