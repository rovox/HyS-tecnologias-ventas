import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CloseCashDto, ListCashClosesQuery } from './dto/cash-close.dto';
export declare class CashCloseService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private assertCloser;
    private box;
    preview(sucursalId: string, dia: string, user: User): Promise<{
        ventas: {
            cantidad: number;
            total: number;
        };
        cierre: ({
            sucursal: {
                id: string;
                nombre: string;
            };
            caja: {
                id: string;
                nombre: string;
            };
            cerradoPor: {
                id: string;
                name: string;
            };
            revisadoPor: {
                id: string;
                name: string;
            } | null;
            diferenciaMovimiento: {
                id: string;
                tipo: string;
                monto: Prisma.Decimal;
                estado: string;
            } | null;
        } & {
            id: string;
            sucursalId: string;
            observaciones: string | null;
            cerradoAt: Date;
            cajaId: string;
            dia: string;
            saldoInicial: Prisma.Decimal;
            ingresosEfectivo: Prisma.Decimal;
            egresosEfectivo: Prisma.Decimal;
            efectivoEsperado: Prisma.Decimal;
            conteo: Prisma.JsonValue;
            efectivoContado: Prisma.Decimal;
            diferencia: Prisma.Decimal;
            motivoDiferencia: string | null;
            totalQr: Prisma.Decimal;
            totalTransferencia: Prisma.Decimal;
            ventasCantidad: number;
            ventasTotal: Prisma.Decimal;
            cerradoPorId: string;
            revisadoPorId: string | null;
            revisadoAt: Date | null;
            revisionEstado: string | null;
            revisionMotivo: string | null;
            diferenciaMovimientoId: string | null;
        }) | null;
        qr: number;
        transferencia: number;
        sucursal: {
            id: string;
            nombre: string;
        };
        caja: {
            id: string;
            nombre: string;
        };
        dia: string;
        saldoInicial: number;
        requisitos: {
            ok: boolean;
            texto: string;
        }[];
        cierreAnterior: {
            dia: string;
            efectivoContado: number;
        } | null;
        ingresosEfectivo: number;
        egresosEfectivo: number;
        efectivoEsperado: number;
        movimientos: {
            efecto: number | undefined;
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
        }[];
    }>;
    close(dto: CloseCashDto, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
        };
        caja: {
            id: string;
            nombre: string;
        };
        cerradoPor: {
            id: string;
            name: string;
        };
        revisadoPor: {
            id: string;
            name: string;
        } | null;
        diferenciaMovimiento: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string | null;
        cerradoAt: Date;
        cajaId: string;
        dia: string;
        saldoInicial: Prisma.Decimal;
        ingresosEfectivo: Prisma.Decimal;
        egresosEfectivo: Prisma.Decimal;
        efectivoEsperado: Prisma.Decimal;
        conteo: Prisma.JsonValue;
        efectivoContado: Prisma.Decimal;
        diferencia: Prisma.Decimal;
        motivoDiferencia: string | null;
        totalQr: Prisma.Decimal;
        totalTransferencia: Prisma.Decimal;
        ventasCantidad: number;
        ventasTotal: Prisma.Decimal;
        cerradoPorId: string;
        revisadoPorId: string | null;
        revisadoAt: Date | null;
        revisionEstado: string | null;
        revisionMotivo: string | null;
        diferenciaMovimientoId: string | null;
    }>;
    list(query: ListCashClosesQuery, user: User): Promise<({
        sucursal: {
            id: string;
            nombre: string;
        };
        caja: {
            id: string;
            nombre: string;
        };
        cerradoPor: {
            id: string;
            name: string;
        };
        revisadoPor: {
            id: string;
            name: string;
        } | null;
        diferenciaMovimiento: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string | null;
        cerradoAt: Date;
        cajaId: string;
        dia: string;
        saldoInicial: Prisma.Decimal;
        ingresosEfectivo: Prisma.Decimal;
        egresosEfectivo: Prisma.Decimal;
        efectivoEsperado: Prisma.Decimal;
        conteo: Prisma.JsonValue;
        efectivoContado: Prisma.Decimal;
        diferencia: Prisma.Decimal;
        motivoDiferencia: string | null;
        totalQr: Prisma.Decimal;
        totalTransferencia: Prisma.Decimal;
        ventasCantidad: number;
        ventasTotal: Prisma.Decimal;
        cerradoPorId: string;
        revisadoPorId: string | null;
        revisadoAt: Date | null;
        revisionEstado: string | null;
        revisionMotivo: string | null;
        diferenciaMovimientoId: string | null;
    })[]>;
    review(id: string, action: 'aprobar' | 'observar', motivo: string | undefined, user: User, sessionId?: string): Promise<{
        sucursal: {
            id: string;
            nombre: string;
        };
        caja: {
            id: string;
            nombre: string;
        };
        cerradoPor: {
            id: string;
            name: string;
        };
        revisadoPor: {
            id: string;
            name: string;
        } | null;
        diferenciaMovimiento: {
            id: string;
            tipo: string;
            monto: Prisma.Decimal;
            estado: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string | null;
        cerradoAt: Date;
        cajaId: string;
        dia: string;
        saldoInicial: Prisma.Decimal;
        ingresosEfectivo: Prisma.Decimal;
        egresosEfectivo: Prisma.Decimal;
        efectivoEsperado: Prisma.Decimal;
        conteo: Prisma.JsonValue;
        efectivoContado: Prisma.Decimal;
        diferencia: Prisma.Decimal;
        motivoDiferencia: string | null;
        totalQr: Prisma.Decimal;
        totalTransferencia: Prisma.Decimal;
        ventasCantidad: number;
        ventasTotal: Prisma.Decimal;
        cerradoPorId: string;
        revisadoPorId: string | null;
        revisadoAt: Date | null;
        revisionEstado: string | null;
        revisionMotivo: string | null;
        diferenciaMovimientoId: string | null;
    }>;
}
