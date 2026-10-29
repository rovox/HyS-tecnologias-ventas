import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../common/prisma/prisma.service';
export declare const VISIT_INCLUDE: {
    cliente: {
        select: {
            id: true;
            nombre: true;
            telefono: true;
            direccion: true;
            mapsLink: true;
        };
    };
    sucursal: {
        select: {
            id: true;
            nombre: true;
        };
    };
    cotizacion: {
        select: {
            id: true;
            numero: true;
            titulo: true;
        };
    };
    usuario: {
        readonly select: {
            readonly id: true;
            readonly name: true;
        };
    };
    trabajoRelacionado: {
        select: {
            id: true;
            descripcionTrabajo: true;
            fechaProgramada: true;
            estado: true;
            project: {
                select: {
                    id: true;
                    codigo: true;
                };
            };
        };
    };
    movements: {
        select: {
            id: true;
            monto: true;
            metodo: true;
            estado: true;
            fecha: true;
            recibidoPor: {
                readonly select: {
                    readonly id: true;
                    readonly name: true;
                };
            };
        };
        orderBy: {
            fecha: "desc";
        };
    };
};
type VisitRow = Prisma.RelevamientoGetPayload<{
    include: typeof VISIT_INCLUDE;
}>;
export declare function fotosOf(fotosUrl: unknown): string[];
export declare function presentVisits(prisma: PrismaService, rows: VisitRow[]): Promise<{
    transicionesValidas: readonly string[];
    cobrado: number;
    porRendir: number;
    tecnico: {
        id: string;
        name: string;
    } | null;
    vendedor: {
        id: string;
        name: string;
    } | null;
    fotos: string[];
    enGarantia: boolean | null;
    movements: {
        monto: number;
        id: string;
        estado: string;
        metodo: string;
        fecha: Date;
        recibidoPor: {
            id: string;
            name: string;
        } | null;
    }[];
    sucursal: {
        id: string;
        nombre: string;
    } | null;
    cotizacion: {
        id: string;
        titulo: string;
        numero: string;
    } | null;
    cliente: {
        id: string;
        nombre: string;
        telefono: string;
        direccion: string;
        mapsLink: string;
    };
    usuario: {
        id: string;
        name: string;
    };
    trabajoRelacionado: {
        project: {
            id: string;
            codigo: string;
        } | null;
        id: string;
        estado: string;
        fechaProgramada: Date;
        descripcionTrabajo: string;
    } | null;
    id: string;
    sucursalId: string | null;
    mapsLink: string;
    createdAt: Date;
    updatedAt: Date;
    tecnicoId: string | null;
    cotizacionId: string | null;
    usuarioId: string;
    clienteId: string;
    estado: string;
    motivo: string;
    vendedorId: string | null;
    lugar: string;
    prioridad: string;
    fecha: Date;
    hora: string | null;
    fotosUrl: Prisma.JsonValue | null;
    fechaFin: Date | null;
    tipoVisita: string;
    notas: string | null;
    problemaReportado: string | null;
    equipoAfectado: string;
    causaProbable: string | null;
    diagnostico: string | null;
    solucion: string | null;
    necesidadCliente: string | null;
    areaRevisar: string;
    medidasPuntos: string | null;
    cantidadEstimada: number | null;
    observacionTecnica: string | null;
    observacionFinal: string | null;
    requiereMaterial: boolean;
    requiereCotizacion: boolean;
    requiereVolver: boolean;
    trabajoRelacionadoId: string | null;
    garantiaHasta: Date | null;
    motivoCancelacion: string | null;
}[]>;
export {};
