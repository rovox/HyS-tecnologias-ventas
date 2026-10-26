import type { User } from '@prisma/client';
import { ClientReportService } from './client-report.service';
export declare class ReportingController {
    private readonly clients;
    constructor(clients: ClientReportService);
    clientList(user: User): Promise<{
        cotizaciones: number;
        saldoPendiente: number;
        proyectosEnCurso: number;
        trabajosEnCurso: number;
        totalContratado: number;
        servicioEnCurso: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        _count: {
            quotations: number;
        };
        id: string;
        nombre: string;
        tipo: string;
        contacto: string;
        email: string;
        telefono: string;
        direccion: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        lastActivityAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    client(id: string, user: User): Promise<{
        proyectos: {
            monto: import("@prisma/client/runtime/library").Decimal;
            cobrado: number;
            saldo: number;
            garantiaHasta: Date | null;
            garantiaVigente: boolean;
            id: string;
            titulo: string;
            estado: string;
            categoria: {
                id: string;
                label: string;
            };
            codigo: string;
            montoOficial: import("@prisma/client/runtime/library").Decimal;
            garantiaMeses: number;
            entregadoAt: Date | null;
        }[];
        trabajos: {
            cobrado: number;
            saldo: number;
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            fechaProgramada: Date;
            categoria: {
                id: string;
                label: string;
            };
            descripcionTrabajo: string;
        }[];
        cotizaciones: {
            id: string;
            createdAt: Date;
            titulo: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            numero: string;
            eliminadaAt: Date | null;
            categoria: {
                label: string;
            };
        }[];
        cobros: {
            schedule: {
                id: string;
                descripcionTrabajo: string;
            } | null;
            project: {
                id: string;
                codigo: string;
            } | null;
            id: string;
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
            metodo: string;
            concepto: string;
            fecha: Date;
        }[];
        relevamientos: {
            id: string;
            estado: string;
            motivo: string;
            lugar: string;
            fecha: Date;
            tipoVisita: string;
            necesidadCliente: string | null;
        }[];
        equipos: {
            proyecto: {
                id: string;
                codigo: string;
            } | null;
            garantiaHasta: Date | null;
            garantiaVigente: boolean;
            id: string;
            fecha: Date;
            projectId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            producto: {
                id: string;
                nombre: string;
                codigo: string;
                marca: string;
            };
        }[];
        saldoPendiente: number;
        proyectosEnCurso: number;
        trabajosEnCurso: number;
        totalContratado: number;
        servicioEnCurso: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        id: string;
        nombre: string;
        tipo: string;
        contacto: string;
        email: string;
        telefono: string;
        direccion: string;
        sucursalId: string;
        observaciones: string;
        mapsLink: string;
        lastActivityAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
