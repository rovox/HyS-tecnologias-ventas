import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { IncomeService } from '../finance';
import { CreateRelevamientoDto, UpdateRelevamientoDto, VisitPaymentDto, VisitStatusDto } from './dto/relevamiento.dto';
export declare class RelevamientosService {
    private readonly prisma;
    private readonly audit;
    private readonly income;
    constructor(prisma: PrismaService, audit: AuditService, income: IncomeService);
    list(user: User, query?: {
        cotizacionId?: string;
        clienteId?: string;
    }): Promise<{
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
        fotosUrl: Prisma.JsonValue | null;
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
        fotosUrl: Prisma.JsonValue | null;
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
    private relatedJob;
    private fields;
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
        fotosUrl: Prisma.JsonValue | null;
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
        fotosUrl: Prisma.JsonValue | null;
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
    changeStatus(id: string, dto: VisitStatusDto, user: User, sessionId?: string): Promise<{
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
        fotosUrl: Prisma.JsonValue | null;
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
    registerPayment(id: string, dto: VisitPaymentDto, user: User, sessionId?: string): Promise<{
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
        fotosUrl: Prisma.JsonValue | null;
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
    attachPhoto(id: string, file: {
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
        fotosUrl: Prisma.JsonValue | null;
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
    filePath(name: string, user: User): Promise<string>;
}
