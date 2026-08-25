import type { User } from '@prisma/client';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metrics;
    constructor(metrics: MetricsService);
    sales(user: User, month?: string, userId?: string): Promise<{
        month: string;
        quotationsTotal: number;
        salesTotal: number;
        goalBs: number;
        remainingBs: number;
    }>;
    activity(user: User, month?: string, userId?: string): Promise<{
        month: string;
        goalBs: number;
        byVendedor: {
            id: string;
            nombre: string;
            cotizaciones: number;
            ventas: number;
            relevamientos: number;
            montoCotizaciones: number;
            montoVentas: number;
            metaBs: number;
            cotizacionesItems: Array<{
                id: string;
                numero: string;
                titulo: string;
                monto: number;
            }>;
            ventasItems: Array<{
                id: string;
                numero: string;
                titulo: string;
                monto: number;
            }>;
            relevamientosItems: Array<{
                id: string;
                lugar: string;
                titulo: string;
                monto: number | null;
                fecha: string | null;
                fotosCount: number;
                hasFotos: boolean;
            }>;
        }[];
        bySucursal: {
            id: string;
            nombre: string;
            cotizaciones: number;
            ventas: number;
            relevamientos: number;
            montoCotizaciones: number;
            montoVentas: number;
            metaBs: number;
            cotizacionesItems: Array<{
                id: string;
                numero: string;
                titulo: string;
                monto: number;
            }>;
            ventasItems: Array<{
                id: string;
                numero: string;
                titulo: string;
                monto: number;
            }>;
            relevamientosItems: Array<{
                id: string;
                lugar: string;
                titulo: string;
                monto: number | null;
                fecha: string | null;
                fotosCount: number;
                hasFotos: boolean;
            }>;
        }[];
        byCategoria: {
            id: string;
            nombre: string;
            cotizaciones: number;
            ventas: number;
            relevamientos: number;
            montoCotizaciones: number;
            montoVentas: number;
            metaBs: number;
            cotizacionesItems: Array<{
                id: string;
                numero: string;
                titulo: string;
                monto: number;
            }>;
            ventasItems: Array<{
                id: string;
                numero: string;
                titulo: string;
                monto: number;
            }>;
            relevamientosItems: Array<{
                id: string;
                lugar: string;
                titulo: string;
                monto: number | null;
                fecha: string | null;
                fotosCount: number;
                hasFotos: boolean;
            }>;
        }[];
        categoryInsights: {
            topSucursalPorCategoria: {
                categoriaId: string;
                categoria: string;
                sucursal: string;
                total: number;
            }[];
            topCategoriaPorVendedor: {
                vendedorId: string;
                vendedor: string;
                categoria: string;
                total: number;
            }[];
        };
        schedules: {
            total: number;
            byEstado: Record<string, number>;
            montoTotal: number;
        };
    }>;
    feed(user: User): Promise<{
        type: string;
        id: string;
        at: Date;
        titulo: string;
        detalle: string;
    }[]>;
}
