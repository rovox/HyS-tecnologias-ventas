import type { Prisma } from '@prisma/client';
export declare const PROJECT_DETAIL: {
    cliente: {
        select: {
            id: true;
            nombre: true;
            direccion: true;
        };
    };
    categoria: {
        select: {
            id: true;
            label: true;
        };
    };
    sucursal: {
        select: {
            id: true;
            nombre: true;
        };
    };
    quotation: {
        select: {
            id: true;
            numero: true;
            titulo: true;
        };
    };
    responsable: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    schedules: {
        include: {
            tecnico: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
        };
        orderBy: {
            createdAt: "asc";
        };
    };
    movements: {
        where: {
            estado: {
                not: string;
            };
        };
        include: {
            registradoPor: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
            schedule: {
                select: {
                    id: true;
                    descripcionTrabajo: true;
                };
            };
        };
        orderBy: {
            fecha: "desc";
        };
    };
    stockMovements: {
        where: {
            tipo: string;
        };
        include: {
            producto: {
                select: {
                    id: true;
                    codigo: true;
                    nombre: true;
                    unidad: true;
                    tipo: true;
                };
            };
        };
        orderBy: {
            fecha: "desc";
        };
    };
};
type ProjectRow = Prisma.ProjectGetPayload<{
    include: typeof PROJECT_DETAIL;
}>;
export declare function presentProject(row: ProjectRow, now?: Date): {
    cobrado: number;
    porValidar: number;
    adicionales: number;
    saldo: number;
    pctCobrado: number;
    costoGastos: number;
    costoMaterial: number;
    costo: number;
    margen: number;
    garantiaHasta: Date | null;
    garantiaVigente: boolean;
    transicionesValidas: readonly string[];
    trabajos: {
        id: string;
        descripcionTrabajo: string;
        estado: string;
        fechaProgramada: Date;
        horario: string | null;
        tecnico: {
            id: string;
            name: string;
        } | null;
    }[];
    cobros: ({
        schedule: {
            id: string;
            descripcionTrabajo: string;
        } | null;
        registradoPor: {
            id: string;
            name: string;
        };
    } & {
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
        asunto: string | null;
        fechaLimite: Date | null;
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
        medioPago: string | null;
        ventaDirectaId: string | null;
        rendidoAt: Date | null;
    })[];
    gastos: ({
        schedule: {
            id: string;
            descripcionTrabajo: string;
        } | null;
        registradoPor: {
            id: string;
            name: string;
        };
    } & {
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
        asunto: string | null;
        fechaLimite: Date | null;
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
        medioPago: string | null;
        ventaDirectaId: string | null;
        rendidoAt: Date | null;
    })[];
    material: ({
        producto: {
            id: string;
            nombre: string;
            tipo: string;
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
    sucursal: {
        id: string;
        nombre: string;
    };
    quotation: {
        id: string;
        titulo: string;
        numero: string;
    };
    cliente: {
        id: string;
        nombre: string;
        direccion: string;
    };
    categoria: {
        id: string;
        label: string;
    };
    responsable: {
        id: string;
        name: string;
    } | null;
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
    montoOficial: Prisma.Decimal;
    motivoAnulacion: string | null;
    garantiaMeses: number;
    entregadoAt: Date | null;
    cerradoAt: Date | null;
    responsableId: string | null;
};
export {};
