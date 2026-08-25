import type { User } from '@prisma/client';
import { CreateQuotationDto, StatusDto, UpdateQuotationDto } from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';
export declare class QuotationsController {
    private readonly quotations;
    constructor(quotations: QuotationsService);
    list(estado?: string, vendedorId?: string, sucursalId?: string, user?: User): import("@prisma/client").Prisma.PrismaPromise<({
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        sale: {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: import("@prisma/client/runtime/library").Decimal;
            status: string;
        } | null;
        sellers: {
            nombre: string;
            userId: string;
            quotationId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        } | null;
    } & {
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
    })[]>;
    get(id: string, user: User): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        sale: ({
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
        }) | null;
        sellers: {
            nombre: string;
            userId: string;
            quotationId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        } | null;
    } & {
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
    }>;
    create(dto: CreateQuotationDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        sellers: {
            nombre: string;
            userId: string;
            quotationId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        } | null;
    } & {
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
    }>;
    patch(id: string, dto: UpdateQuotationDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        sellers: {
            nombre: string;
            userId: string;
            quotationId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        } | null;
    } & {
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
    }>;
    status(id: string, dto: StatusDto, user: User, sessionId?: string): Promise<{
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
    }>;
    accept(id: string, user: User, sessionId?: string): Promise<{
        quotation: {
            sucursal: {
                id: string;
                nombre: string;
                createdAt: Date;
                updatedAt: Date;
            };
            sale: ({
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
            }) | null;
            sellers: {
                nombre: string;
                userId: string;
                quotationId: string;
                commissionPct: import("@prisma/client/runtime/library").Decimal;
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
            } | null;
        } & {
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
        sale: {
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
        };
        alreadyConverted: boolean;
    }>;
    files(id: string, kind: string | undefined, file: {
        buffer?: Buffer;
        path?: string;
        originalname?: string;
    }, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
        };
        sellers: {
            nombre: string;
            userId: string;
            quotationId: string;
            commissionPct: import("@prisma/client/runtime/library").Decimal;
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
        } | null;
    } & {
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
    }>;
}
export declare class QuotationFilesController {
    private readonly quotations;
    constructor(quotations: QuotationsService);
    getFile(name: string, user: User, res: {
        sendFile: (path: string) => unknown;
    }): Promise<unknown>;
}
