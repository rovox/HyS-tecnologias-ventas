import type { User } from '@prisma/client';
import { CreateRelevamientoDto, UpdateRelevamientoDto, VisitPaymentDto, VisitStatusDto } from './dto/relevamiento.dto';
import { RelevamientosService } from './relevamientos.service';
export declare class RelevamientosController {
    private readonly relevamientos;
    constructor(relevamientos: RelevamientosService);
    list(user: User, cotizacionId?: string, clienteId?: string): Promise<{
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
        vendedorId: string | null;
        cotizacionId: string | null;
        usuarioId: string;
        clienteId: string;
        estado: string;
        motivo: string;
        lugar: string;
        prioridad: string;
        fecha: Date;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        fechaFin: Date | null;
        tipoVisita: string;
        notas: string | null;
        hora: string | null;
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
    get(id: string, user: User): Promise<{
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
        vendedorId: string | null;
        cotizacionId: string | null;
        usuarioId: string;
        clienteId: string;
        estado: string;
        motivo: string;
        lugar: string;
        prioridad: string;
        fecha: Date;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        fechaFin: Date | null;
        tipoVisita: string;
        notas: string | null;
        hora: string | null;
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
    }>;
    create(dto: CreateRelevamientoDto, user: User, sessionId?: string): Promise<{
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
        vendedorId: string | null;
        cotizacionId: string | null;
        usuarioId: string;
        clienteId: string;
        estado: string;
        motivo: string;
        lugar: string;
        prioridad: string;
        fecha: Date;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        fechaFin: Date | null;
        tipoVisita: string;
        notas: string | null;
        hora: string | null;
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
    }>;
    update(id: string, dto: UpdateRelevamientoDto, user: User, sessionId?: string): Promise<{
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
        vendedorId: string | null;
        cotizacionId: string | null;
        usuarioId: string;
        clienteId: string;
        estado: string;
        motivo: string;
        lugar: string;
        prioridad: string;
        fecha: Date;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        fechaFin: Date | null;
        tipoVisita: string;
        notas: string | null;
        hora: string | null;
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
    }>;
    status(id: string, dto: VisitStatusDto, user: User, sessionId?: string): Promise<{
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
        vendedorId: string | null;
        cotizacionId: string | null;
        usuarioId: string;
        clienteId: string;
        estado: string;
        motivo: string;
        lugar: string;
        prioridad: string;
        fecha: Date;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        fechaFin: Date | null;
        tipoVisita: string;
        notas: string | null;
        hora: string | null;
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
    }>;
    pay(id: string, dto: VisitPaymentDto, user: User, sessionId?: string): Promise<{
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
        vendedorId: string | null;
        cotizacionId: string | null;
        usuarioId: string;
        clienteId: string;
        estado: string;
        motivo: string;
        lugar: string;
        prioridad: string;
        fecha: Date;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        fechaFin: Date | null;
        tipoVisita: string;
        notas: string | null;
        hora: string | null;
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
    }>;
    files(id: string, file: {
        buffer?: Buffer;
        originalname?: string;
        mimetype?: string;
    }, user: User, sessionId?: string): Promise<{
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
        vendedorId: string | null;
        cotizacionId: string | null;
        usuarioId: string;
        clienteId: string;
        estado: string;
        motivo: string;
        lugar: string;
        prioridad: string;
        fecha: Date;
        fotosUrl: import("@prisma/client/runtime/library").JsonValue | null;
        fechaFin: Date | null;
        tipoVisita: string;
        notas: string | null;
        hora: string | null;
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
    }>;
}
export declare class RelevamientoFilesController {
    private readonly relevamientos;
    constructor(relevamientos: RelevamientosService);
    getFile(name: string, user: User, res: {
        sendFile: (path: string) => unknown;
    }): Promise<unknown>;
}
