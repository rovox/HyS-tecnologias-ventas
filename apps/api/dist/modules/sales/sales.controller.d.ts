import type { User } from '@prisma/client';
import { CreateJobDto, CreatePaymentDto, JobStatusDto } from './dto/sales.dto';
import { SalesService } from './sales.service';
export declare class SalesController {
    private readonly sales;
    constructor(sales: SalesService);
    list(user: User): import("@prisma/client").Prisma.PrismaPromise<({
        quotation: {
            id: string;
            sucursalId: string;
            createdAt: Date;
            updatedAt: Date;
            vendedorId: string;
            titulo: string;
            clienteId: string | null;
            categoriaId: string;
            subcategoria: string;
            sucursalNombre: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            observacion: string;
            archivo: string;
            tieneLicitacion: boolean;
            licitacionNumero: string | null;
            licitacionEntidad: string | null;
            plazoFinal: Date | null;
            fechaEnvio: Date | null;
            estado: string;
            motivoRechazo: string | null;
            numero: string;
            eliminadaAt: Date | null;
            eliminadaPorId: string | null;
            motivoEliminacion: string | null;
            archivoPdfUrl: string;
            licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
        };
        jobs: {
            id: string;
            asignadoId: string | null;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            saleId: string;
        }[];
        payments: {
            at: Date;
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            metodo: string;
            nota: string;
            saleId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        quotationId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: string;
    })[]>;
    get(id: string, user: User): Promise<{
        cobrado: number;
        saldo: number;
        quotation: {
            id: string;
            sucursalId: string;
            createdAt: Date;
            updatedAt: Date;
            vendedorId: string;
            titulo: string;
            clienteId: string | null;
            categoriaId: string;
            subcategoria: string;
            sucursalNombre: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            observacion: string;
            archivo: string;
            tieneLicitacion: boolean;
            licitacionNumero: string | null;
            licitacionEntidad: string | null;
            plazoFinal: Date | null;
            fechaEnvio: Date | null;
            estado: string;
            motivoRechazo: string | null;
            numero: string;
            eliminadaAt: Date | null;
            eliminadaPorId: string | null;
            motivoEliminacion: string | null;
            archivoPdfUrl: string;
            licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
        };
        jobs: {
            id: string;
            asignadoId: string | null;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            saleId: string;
        }[];
        payments: {
            at: Date;
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            metodo: string;
            nota: string;
            saleId: string;
        }[];
        id: string;
        createdAt: Date;
        quotationId: string;
        total: import("@prisma/client/runtime/library").Decimal;
        status: string;
    }>;
    addJob(id: string, dto: CreateJobDto, user: User, sessionId?: string): Promise<{
        id: string;
        asignadoId: string | null;
        titulo: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        saleId: string;
    }>;
    updateJob(id: string, jobId: string, dto: JobStatusDto, user: User, sessionId?: string): Promise<{
        id: string;
        asignadoId: string | null;
        titulo: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        saleId: string;
    }>;
    addPayment(id: string, dto: CreatePaymentDto, user: User, sessionId?: string): Promise<{
        at: Date;
        id: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        metodo: string;
        nota: string;
        saleId: string;
    }>;
}
