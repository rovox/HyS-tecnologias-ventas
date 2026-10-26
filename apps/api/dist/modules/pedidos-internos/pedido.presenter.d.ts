import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
export declare const PEDIDO_INCLUDE: {
    responsable: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    solicitante: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    sucursalOrigen: {
        select: {
            id: true;
            nombre: true;
        };
    };
    items: true;
    _count: {
        select: {
            comentarios: true;
        };
    };
};
type PedidoRow = Prisma.PedidoInternoGetPayload<{
    include: typeof PEDIDO_INCLUDE;
}>;
export declare function presentPedidos(prisma: PrismaService, rows: PedidoRow[]): Promise<{
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
export {};
