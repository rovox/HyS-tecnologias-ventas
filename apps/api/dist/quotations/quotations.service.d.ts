import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { CreateQuotationDto, UpdateQuotationDto } from './dto/quotation.dto';
export declare class QuotationsService {
    private readonly prisma;
    private readonly activity;
    constructor(prisma: PrismaService, activity: ActivityService);
    private nextNumero;
    private requireSucursal;
    private assertCommission;
    list(filters: {
        estado?: string;
        vendedorId?: string;
        sucursalId?: string;
    }, user: User): Prisma.PrismaPromise<({
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
            total: Prisma.Decimal;
            status: string;
        } | null;
        sellers: {
            nombre: string;
            userId: string;
            quotationId: string;
            commissionPct: Prisma.Decimal;
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
        monto: Prisma.Decimal;
        observacion: string;
        archivo: string;
        archivoPdfUrl: string;
        tieneLicitacion: boolean;
        licitacionNumero: string | null;
        licitacionEntidad: string | null;
        plazoFinal: Date | null;
        fechaEnvio: Date | null;
        licitacionArchivos: Prisma.JsonValue | null;
    })[]>;
    get(id: string, user?: User): Promise<{
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
                monto: Prisma.Decimal;
                saleId: string;
            }[];
            payments: {
                id: string;
                at: Date;
                monto: Prisma.Decimal;
                saleId: string;
                metodo: string;
                nota: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: Prisma.Decimal;
            status: string;
        }) | null;
        sellers: {
            nombre: string;
            userId: string;
            quotationId: string;
            commissionPct: Prisma.Decimal;
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
        monto: Prisma.Decimal;
        observacion: string;
        archivo: string;
        archivoPdfUrl: string;
        tieneLicitacion: boolean;
        licitacionNumero: string | null;
        licitacionEntidad: string | null;
        plazoFinal: Date | null;
        fechaEnvio: Date | null;
        licitacionArchivos: Prisma.JsonValue | null;
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
            commissionPct: Prisma.Decimal;
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
        monto: Prisma.Decimal;
        observacion: string;
        archivo: string;
        archivoPdfUrl: string;
        tieneLicitacion: boolean;
        licitacionNumero: string | null;
        licitacionEntidad: string | null;
        plazoFinal: Date | null;
        fechaEnvio: Date | null;
        licitacionArchivos: Prisma.JsonValue | null;
    }>;
    updateStatus(id: string, estado: string, user: User, sessionId?: string, motivoRechazo?: string, fechaEnvio?: string): Promise<{
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
        monto: Prisma.Decimal;
        observacion: string;
        archivo: string;
        archivoPdfUrl: string;
        tieneLicitacion: boolean;
        licitacionNumero: string | null;
        licitacionEntidad: string | null;
        plazoFinal: Date | null;
        fechaEnvio: Date | null;
        licitacionArchivos: Prisma.JsonValue | null;
    }>;
    update(id: string, dto: UpdateQuotationDto, user: User, sessionId?: string): Promise<{
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
            commissionPct: Prisma.Decimal;
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
        monto: Prisma.Decimal;
        observacion: string;
        archivo: string;
        archivoPdfUrl: string;
        tieneLicitacion: boolean;
        licitacionNumero: string | null;
        licitacionEntidad: string | null;
        plazoFinal: Date | null;
        fechaEnvio: Date | null;
        licitacionArchivos: Prisma.JsonValue | null;
    }>;
    attachFile(id: string, file: {
        buffer?: Buffer;
        path?: string;
        originalname?: string;
    }, user: User, sessionId?: string, kind?: string): Promise<{
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
            commissionPct: Prisma.Decimal;
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
        monto: Prisma.Decimal;
        observacion: string;
        archivo: string;
        archivoPdfUrl: string;
        tieneLicitacion: boolean;
        licitacionNumero: string | null;
        licitacionEntidad: string | null;
        plazoFinal: Date | null;
        fechaEnvio: Date | null;
        licitacionArchivos: Prisma.JsonValue | null;
    }>;
    filePath(name: string, user: User): Promise<string>;
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
                    monto: Prisma.Decimal;
                    saleId: string;
                }[];
                payments: {
                    id: string;
                    at: Date;
                    monto: Prisma.Decimal;
                    saleId: string;
                    metodo: string;
                    nota: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                quotationId: string;
                total: Prisma.Decimal;
                status: string;
            }) | null;
            sellers: {
                nombre: string;
                userId: string;
                quotationId: string;
                commissionPct: Prisma.Decimal;
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
            monto: Prisma.Decimal;
            observacion: string;
            archivo: string;
            archivoPdfUrl: string;
            tieneLicitacion: boolean;
            licitacionNumero: string | null;
            licitacionEntidad: string | null;
            plazoFinal: Date | null;
            fechaEnvio: Date | null;
            licitacionArchivos: Prisma.JsonValue | null;
        };
        sale: {
            jobs: {
                id: string;
                asignadoId: string | null;
                estado: string;
                titulo: string;
                monto: Prisma.Decimal;
                saleId: string;
            }[];
            payments: {
                id: string;
                at: Date;
                monto: Prisma.Decimal;
                saleId: string;
                metodo: string;
                nota: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            quotationId: string;
            total: Prisma.Decimal;
            status: string;
        };
        alreadyConverted: boolean;
    }>;
}
