import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AcceptQuotationDto } from './dto/quotation.dto';
import { ProjectsService } from '../projects';
export declare class QuotationFlowService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly audit;
    private readonly projects;
    private readonly logger;
    private expiryTimer?;
    constructor(prisma: PrismaService, audit: AuditService, projects: ProjectsService);
    private row;
    private get;
    onModuleInit(): void;
    onModuleDestroy(): void;
    expireOverdue(now?: Date): Promise<number>;
    updateStatus(id: string, estado: string, user: User, sessionId?: string, motivoRechazo?: string, fechaEnvio?: string): Promise<{
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
    remove(id: string, motivo: string, user: User, sessionId?: string): Promise<{
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
    restore(id: string, user: User, sessionId?: string): Promise<{
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
            adelanto: import("@prisma/client/runtime/library").Decimal;
            fechaFinalizacion: Date | null;
            saldo: import("@prisma/client/runtime/library").Decimal;
            projectId: string | null;
            fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        };
        alreadyConverted: boolean;
    }>;
}
