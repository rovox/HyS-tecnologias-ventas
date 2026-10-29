import type { Prisma, User } from '@prisma/client';
import { InventoryService } from '../inventory';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AddComentarioDto, UpdateEstadoPedidoDto, UpsertPedidoInternoDto } from './dto/pedido-interno.dto';
export declare class PedidosInternosService {
    private readonly prisma;
    private readonly audit;
    private readonly inventory;
    constructor(prisma: PrismaService, audit: AuditService, inventory: InventoryService);
    private assertCanManage;
    private assertCanSee;
    private emit;
    private deliver;
    private assertTransition;
    findAll(user: User, query: Record<string, string>): Promise<{
        items: {
            costoTotal: number;
            cantidad: number;
            costoUnitario: number | null;
            id: string;
            observaciones: string | null;
            createdAt: Date;
            unidad: string;
            productoId: string | null;
            pedidoId: string;
            materialNombre: string;
        }[];
        codigo: string;
        destino: {
            tipo: "trabajo";
            trabajo: {
                project: {
                    id: string;
                    codigo: string;
                } | null;
                id: string;
                estado: string;
                fechaProgramada: Date;
                cliente: {
                    id: string;
                    nombre: string;
                };
                descripcionTrabajo: string;
            };
            sucursal?: undefined;
        } | {
            tipo: "sucursal";
            sucursal: {
                id: string;
                nombre: string;
            } | null;
            trabajo?: undefined;
        };
        entregadoPor: {
            id: string;
            name: string;
        } | null;
        costoTotal: number;
        transicionesValidas: readonly string[];
        _count: {
            comentarios: number;
        };
        responsable: {
            id: string;
            name: string;
        };
        sucursalOrigen: {
            id: string;
            nombre: string;
        } | null;
        solicitante: {
            id: string;
            name: string;
        };
        id: string;
        observaciones: string | null;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        prioridad: string;
        responsableId: string;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        solicitanteId: string;
        cronogramaId: string | null;
        fechaEntregaEstimada: Date | null;
        fechaEntregaReal: Date | null;
        entregadoPorId: string | null;
    }[]>;
    findOne(id: string, user: User): Promise<{
        comentarios: ({
            autor: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            pedidoId: string;
            contenido: string;
            autorId: string;
        })[];
        movimientos: ({
            producto: {
                id: string;
                nombre: string;
                codigo: string;
                unidad: string;
            };
        } & {
            id: string;
            tipo: string;
            createdAt: Date;
            motivo: string | null;
            nota: string;
            fecha: Date;
            projectId: string | null;
            registradoPorId: string;
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            productoId: string;
            pedidoInternoId: string | null;
        })[];
        items: {
            costoTotal: number;
            cantidad: number;
            costoUnitario: number | null;
            id: string;
            observaciones: string | null;
            createdAt: Date;
            unidad: string;
            productoId: string | null;
            pedidoId: string;
            materialNombre: string;
        }[];
        codigo: string;
        destino: {
            tipo: "trabajo";
            trabajo: {
                project: {
                    id: string;
                    codigo: string;
                } | null;
                id: string;
                estado: string;
                fechaProgramada: Date;
                cliente: {
                    id: string;
                    nombre: string;
                };
                descripcionTrabajo: string;
            };
            sucursal?: undefined;
        } | {
            tipo: "sucursal";
            sucursal: {
                id: string;
                nombre: string;
            } | null;
            trabajo?: undefined;
        };
        entregadoPor: {
            id: string;
            name: string;
        } | null;
        costoTotal: number;
        transicionesValidas: readonly string[];
        _count: {
            comentarios: number;
        };
        responsable: {
            id: string;
            name: string;
        };
        sucursalOrigen: {
            id: string;
            nombre: string;
        } | null;
        solicitante: {
            id: string;
            name: string;
        };
        id: string;
        observaciones: string | null;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        prioridad: string;
        responsableId: string;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        solicitanteId: string;
        cronogramaId: string | null;
        fechaEntregaEstimada: Date | null;
        fechaEntregaReal: Date | null;
        entregadoPorId: string | null;
    }>;
    create(dto: UpsertPedidoInternoDto, user: User, sessionId?: string): Promise<{
        items: {
            costoTotal: number;
            cantidad: number;
            costoUnitario: number | null;
            id: string;
            observaciones: string | null;
            createdAt: Date;
            unidad: string;
            productoId: string | null;
            pedidoId: string;
            materialNombre: string;
        }[];
        codigo: string;
        destino: {
            tipo: "trabajo";
            trabajo: {
                project: {
                    id: string;
                    codigo: string;
                } | null;
                id: string;
                estado: string;
                fechaProgramada: Date;
                cliente: {
                    id: string;
                    nombre: string;
                };
                descripcionTrabajo: string;
            };
            sucursal?: undefined;
        } | {
            tipo: "sucursal";
            sucursal: {
                id: string;
                nombre: string;
            } | null;
            trabajo?: undefined;
        };
        entregadoPor: {
            id: string;
            name: string;
        } | null;
        costoTotal: number;
        transicionesValidas: readonly string[];
        _count: {
            comentarios: number;
        };
        responsable: {
            id: string;
            name: string;
        };
        sucursalOrigen: {
            id: string;
            nombre: string;
        } | null;
        solicitante: {
            id: string;
            name: string;
        };
        id: string;
        observaciones: string | null;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        prioridad: string;
        responsableId: string;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        solicitanteId: string;
        cronogramaId: string | null;
        fechaEntregaEstimada: Date | null;
        fechaEntregaReal: Date | null;
        entregadoPorId: string | null;
    }>;
    update(id: string, dto: UpsertPedidoInternoDto, user: User, sessionId?: string): Promise<{
        comentarios: ({
            autor: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            pedidoId: string;
            contenido: string;
            autorId: string;
        })[];
        movimientos: ({
            producto: {
                id: string;
                nombre: string;
                codigo: string;
                unidad: string;
            };
        } & {
            id: string;
            tipo: string;
            createdAt: Date;
            motivo: string | null;
            nota: string;
            fecha: Date;
            projectId: string | null;
            registradoPorId: string;
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            productoId: string;
            pedidoInternoId: string | null;
        })[];
        items: {
            costoTotal: number;
            cantidad: number;
            costoUnitario: number | null;
            id: string;
            observaciones: string | null;
            createdAt: Date;
            unidad: string;
            productoId: string | null;
            pedidoId: string;
            materialNombre: string;
        }[];
        codigo: string;
        destino: {
            tipo: "trabajo";
            trabajo: {
                project: {
                    id: string;
                    codigo: string;
                } | null;
                id: string;
                estado: string;
                fechaProgramada: Date;
                cliente: {
                    id: string;
                    nombre: string;
                };
                descripcionTrabajo: string;
            };
            sucursal?: undefined;
        } | {
            tipo: "sucursal";
            sucursal: {
                id: string;
                nombre: string;
            } | null;
            trabajo?: undefined;
        };
        entregadoPor: {
            id: string;
            name: string;
        } | null;
        costoTotal: number;
        transicionesValidas: readonly string[];
        _count: {
            comentarios: number;
        };
        responsable: {
            id: string;
            name: string;
        };
        sucursalOrigen: {
            id: string;
            nombre: string;
        } | null;
        solicitante: {
            id: string;
            name: string;
        };
        id: string;
        observaciones: string | null;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        prioridad: string;
        responsableId: string;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        solicitanteId: string;
        cronogramaId: string | null;
        fechaEntregaEstimada: Date | null;
        fechaEntregaReal: Date | null;
        entregadoPorId: string | null;
    }>;
    remove(id: string, user: User, sessionId?: string): Promise<{
        ok: boolean;
    }>;
    updateEstado(id: string, dto: UpdateEstadoPedidoDto, user: User, sessionId?: string): Promise<{
        comentarios: ({
            autor: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            pedidoId: string;
            contenido: string;
            autorId: string;
        })[];
        movimientos: ({
            producto: {
                id: string;
                nombre: string;
                codigo: string;
                unidad: string;
            };
        } & {
            id: string;
            tipo: string;
            createdAt: Date;
            motivo: string | null;
            nota: string;
            fecha: Date;
            projectId: string | null;
            registradoPorId: string;
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            productoId: string;
            pedidoInternoId: string | null;
        })[];
        items: {
            costoTotal: number;
            cantidad: number;
            costoUnitario: number | null;
            id: string;
            observaciones: string | null;
            createdAt: Date;
            unidad: string;
            productoId: string | null;
            pedidoId: string;
            materialNombre: string;
        }[];
        codigo: string;
        destino: {
            tipo: "trabajo";
            trabajo: {
                project: {
                    id: string;
                    codigo: string;
                } | null;
                id: string;
                estado: string;
                fechaProgramada: Date;
                cliente: {
                    id: string;
                    nombre: string;
                };
                descripcionTrabajo: string;
            };
            sucursal?: undefined;
        } | {
            tipo: "sucursal";
            sucursal: {
                id: string;
                nombre: string;
            } | null;
            trabajo?: undefined;
        };
        entregadoPor: {
            id: string;
            name: string;
        } | null;
        costoTotal: number;
        transicionesValidas: readonly string[];
        _count: {
            comentarios: number;
        };
        responsable: {
            id: string;
            name: string;
        };
        sucursalOrigen: {
            id: string;
            nombre: string;
        } | null;
        solicitante: {
            id: string;
            name: string;
        };
        id: string;
        observaciones: string | null;
        createdAt: Date;
        updatedAt: Date;
        estado: string;
        prioridad: string;
        responsableId: string;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        solicitanteId: string;
        cronogramaId: string | null;
        fechaEntregaEstimada: Date | null;
        fechaEntregaReal: Date | null;
        entregadoPorId: string | null;
    }>;
    addComentario(id: string, dto: AddComentarioDto, user: User, sessionId?: string): Promise<{
        autor: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        pedidoId: string;
        contenido: string;
        autorId: string;
    }>;
}
