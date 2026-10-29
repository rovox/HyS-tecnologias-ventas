import type { User } from '@prisma/client';
import { AcceptQuotationDto, CreateQuotationDto, DeleteQuotationDto, ListQuotationsQuery, StatusDto, UpdateQuotationDto } from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';
import { QuotationFilesService } from './quotation-files.service';
import { QuotationFlowService } from './quotation-flow.service';
export declare class QuotationsController {
    private readonly quotations;
    private readonly quotationFiles;
    private readonly flow;
    constructor(quotations: QuotationsService, quotationFiles: QuotationFilesService, flow: QuotationFlowService);
    list(query: ListQuotationsQuery, user: User): Promise<{
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
    get(id: string, user: User): Promise<{
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    patch(id: string, dto: UpdateQuotationDto, user: User, sessionId?: string): Promise<{
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    status(id: string, dto: StatusDto, user: User, sessionId?: string): Promise<{
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    remove(id: string, dto: DeleteQuotationDto, user: User, sessionId?: string): Promise<{
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    restore(id: string, user: User, sessionId?: string): Promise<{
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
    accept(id: string, dto: AcceptQuotationDto, user: User, sessionId?: string): Promise<{
        quotation: {
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
                commissionPct: import("@prisma/client/runtime/library").Decimal;
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
            vendedorId: string;
            numero: string;
            eliminadaAt: Date | null;
            eliminadaPorId: string | null;
            motivoEliminacion: string | null;
            archivoPdfUrl: string;
            licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
        };
        project: {
            id: string;
            sucursalId: string;
            createdAt: Date;
            updatedAt: Date;
            titulo: string;
            clienteId: string;
            categoriaId: string;
            estado: string;
            codigo: string;
            quotationId: string;
            montoOficial: import("@prisma/client/runtime/library").Decimal;
            motivoAnulacion: string | null;
            garantiaMeses: number;
            entregadoAt: Date | null;
            cerradoAt: Date | null;
            responsableId: string | null;
        };
        schedule: {
            id: string;
            sucursalId: string;
            observaciones: string;
            mapsLink: string;
            createdAt: Date;
            updatedAt: Date;
            tecnicoId: string | null;
            clienteId: string;
            categoriaId: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            vendedorId: string | null;
            fechaProgramada: Date;
            lugar: string;
            horario: string | null;
            quotationId: string | null;
            descripcionTrabajo: string;
            fechaFinalizacion: Date | null;
            projectId: string | null;
            fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        };
        alreadyConverted: boolean;
    }>;
    files(id: string, kind: string | undefined, file: {
        buffer?: Buffer;
        path?: string;
        originalname?: string;
    }, user: User, sessionId?: string): Promise<{
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
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        vendedorId: string;
        numero: string;
        eliminadaAt: Date | null;
        eliminadaPorId: string | null;
        motivoEliminacion: string | null;
        archivoPdfUrl: string;
        licitacionArchivos: import("@prisma/client/runtime/library").JsonValue | null;
    }>;
}
export declare class QuotationFilesController {
    private readonly files;
    constructor(files: QuotationFilesService);
    getFile(name: string, user: User, res: {
        sendFile: (path: string) => unknown;
    }): Promise<unknown>;
}
