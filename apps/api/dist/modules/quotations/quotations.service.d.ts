import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CategoriesService } from '../categories';
import { TasksService } from '../tasks';
import { CreateQuotationDto, ListQuotationsQuery, UpdateQuotationDto } from './dto/quotation.dto';
import { QuotationFlowService } from './quotation-flow.service';
export declare class QuotationsService {
    private readonly prisma;
    private readonly audit;
    private readonly categories;
    private readonly flow;
    private readonly tasks;
    constructor(prisma: PrismaService, audit: AuditService, categories: CategoriesService, flow: QuotationFlowService, tasks: TasksService);
    private nextNumero;
    private requireSucursal;
    private assertCommission;
    list(filters: ListQuotationsQuery, user: User): Promise<{
        proyectoId: string | null;
        venceEl: Date | null;
        transicionesValidas: readonly string[];
        puedeEliminar: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        sale: {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
        _count: {
            relevamientos: number;
            tasks: number;
        };
        sellers: {
            nombre: string;
            userId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
            quotationId: string;
        }[];
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
    }[]>;
    row(id: string, user?: User): Promise<{
        sucursal: {
            id: string;
            nombre: string;
        };
        sale: {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
        _count: {
            relevamientos: number;
            tasks: number;
        };
        sellers: {
            nombre: string;
            userId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
            quotationId: string;
        }[];
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
    } & {
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
    }>;
    get(id: string, user?: User): Promise<{
        proyectoId: string | null;
        venceEl: Date | null;
        transicionesValidas: readonly string[];
        puedeEliminar: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        sale: {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
        _count: {
            relevamientos: number;
            tasks: number;
        };
        sellers: {
            nombre: string;
            userId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
            quotationId: string;
        }[];
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
    }>;
    create(dto: CreateQuotationDto, user: User, sessionId?: string): Promise<{
        proyectoId: string | null;
        venceEl: Date | null;
        transicionesValidas: readonly string[];
        puedeEliminar: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        sale: {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
        _count: {
            relevamientos: number;
            tasks: number;
        };
        sellers: {
            nombre: string;
            userId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
            quotationId: string;
        }[];
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
    }>;
    update(id: string, dto: UpdateQuotationDto, user: User, sessionId?: string): Promise<{
        proyectoId: string | null;
        venceEl: Date | null;
        transicionesValidas: readonly string[];
        puedeEliminar: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        sale: {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: string;
        } | null;
        project: {
            id: string;
            estado: string;
            codigo: string;
        } | null;
        _count: {
            relevamientos: number;
            tasks: number;
        };
        sellers: {
            nombre: string;
            userId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
            quotationId: string;
        }[];
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
    }>;
}
