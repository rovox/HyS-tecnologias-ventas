import type { Prisma } from '@prisma/client';
export declare const DETAIL: {
    sellers: true;
    cliente: {
        select: {
            id: true;
            nombre: true;
            direccion: true;
        };
    };
    sucursal: {
        select: {
            id: true;
            nombre: true;
        };
    };
    categoria: {
        readonly select: {
            readonly id: true;
            readonly label: true;
        };
    };
    vendedor: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    eliminadaPor: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    sale: true;
    project: {
        select: {
            id: true;
            codigo: true;
            estado: true;
        };
    };
    _count: {
        select: {
            relevamientos: true;
            tasks: true;
        };
    };
};
export type QuotationRow = Prisma.QuotationGetPayload<{
    include: typeof DETAIL;
}>;
export declare function present(row: QuotationRow): {
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
        total: Prisma.Decimal;
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
        commissionPct: Prisma.Decimal;
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
    numero: string;
    eliminadaAt: Date | null;
    eliminadaPorId: string | null;
    motivoEliminacion: string | null;
    archivoPdfUrl: string;
    licitacionArchivos: Prisma.JsonValue | null;
};
