import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { QuotationsService } from './quotations.service';
export declare class QuotationFilesService {
    private readonly prisma;
    private readonly audit;
    private readonly quotations;
    constructor(prisma: PrismaService, audit: AuditService, quotations: QuotationsService);
    attachFile(id: string, file: {
        buffer?: Buffer;
        path?: string;
        originalname?: string;
    }, user: User, sessionId?: string, kind?: string): Promise<{
        proyectoId: string | null;
        venceEl: Date | null;
        transicionesValidas: readonly string[];
        puedeEliminar: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
        _count: {
            relevamientos: number;
            tasks: number;
        };
        cliente: {
            id: string;
            nombre: string;
            direccion: string;
        } | null;
        categoria: {
            id: string;
            label: string;
        };
        eliminadaPor: {
            id: string;
            name: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
        };
        sellers: {
            nombre: string;
            userId: string;
            commissionPct: Prisma.Decimal;
            quotationId: string;
        }[];
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        titulo: string;
        clienteId: string | null;
        categoriaId: string;
        subcategoria: string;
        sucursalNombre: string;
        monto: Prisma.Decimal;
        observacion: string;
        archivo: string;
        tieneLicitacion: boolean;
        licitacionNumero: string | null;
        licitacionEntidad: string | null;
        plazoFinal: Date | null;
        fechaEnvio: Date | null;
        estado: string;
        motivoRechazo: string | null;
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: Prisma.JsonValue | null;
    }>;
    filePath(name: string, user: User): Promise<string>;
}
