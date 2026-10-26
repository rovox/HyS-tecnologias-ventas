import type { Prisma } from '@prisma/client';
export declare const MOVEMENT_DETAIL: {
    project: {
        select: {
            id: true;
            codigo: true;
            titulo: true;
        };
    };
    schedule: {
        select: {
            id: true;
            descripcionTrabajo: true;
        };
    };
    relevamiento: {
        select: {
            id: true;
            tipoVisita: true;
            fecha: true;
        };
    };
    cliente: {
        select: {
            id: true;
            nombre: true;
        };
    };
    caja: {
        readonly select: {
            readonly id: true;
            readonly nombre: true;
        };
    };
    cajaDestino: {
        readonly select: {
            readonly id: true;
            readonly nombre: true;
        };
    };
    sucursal: {
        select: {
            id: true;
            nombre: true;
        };
    };
    registradoPor: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    validadoPor: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    recibidoPor: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
};
type MovementRow = Prisma.CashMovementGetPayload<{
    include: typeof MOVEMENT_DETAIL;
}>;
export declare function presentMovement(row: MovementRow): {
    transicionesValidas: readonly string[];
    reembolsoPendiente: boolean;
    sucursal: {
        id: string;
        nombre: string;
    };
    relevamiento: {
        id: string;
        fecha: Date;
        tipoVisita: string;
    } | null;
    schedule: {
        id: string;
        descripcionTrabajo: string;
    } | null;
    project: {
        id: string;
        titulo: string;
        codigo: string;
    } | null;
    cliente: {
        id: string;
        nombre: string;
    } | null;
    caja: {
        id: string;
        nombre: string;
    } | null;
    cajaDestino: {
        id: string;
        nombre: string;
    } | null;
    registradoPor: {
        id: string;
        name: string;
    };
    validadoPor: {
        id: string;
        name: string;
    } | null;
    recibidoPor: {
        id: string;
        name: string;
    } | null;
    id: string;
    tipo: string;
    sucursalId: string;
    createdAt: Date;
    updatedAt: Date;
    clienteId: string | null;
    monto: Prisma.Decimal;
    estado: string;
    motivo: string | null;
    scheduleId: string | null;
    metodo: string;
    nota: string;
    relevamientoId: string | null;
    recibidoPorId: string | null;
    cajaId: string | null;
    concepto: string;
    fecha: Date;
    projectId: string | null;
    cajaDestinoId: string | null;
    pagadoPor: string | null;
    reembolsadoAt: Date | null;
    comprobanteUrl: string | null;
    reversaDeId: string | null;
    registradoPorId: string;
    validadoPorId: string | null;
    validadoAt: Date | null;
};
export {};
