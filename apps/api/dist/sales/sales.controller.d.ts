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
            id: string;
            at: Date;
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
    get(id: string, user: User): Promise<{
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
            id: string;
            at: Date;
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
    addJob(id: string, dto: CreateJobDto, user: User, sessionId?: string): Promise<{
        id: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        saleId: string;
    }>;
    updateJob(id: string, jobId: string, dto: JobStatusDto, user: User, sessionId?: string): Promise<{
        id: string;
        asignadoId: string | null;
        estado: string;
        titulo: string;
        monto: import("@prisma/client/runtime/library").Decimal;
        saleId: string;
    }>;
    addPayment(id: string, dto: CreatePaymentDto, user: User, sessionId?: string): Promise<{
        id: string;
        at: Date;
        monto: import("@prisma/client/runtime/library").Decimal;
        saleId: string;
        metodo: string;
        nota: string;
    }>;
}
