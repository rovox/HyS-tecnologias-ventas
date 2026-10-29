import { StreamableFile } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CreateMovementDto, ExportMovementsQuery, ImpactQuery, ListMovementsQuery, ReasonDto, SettleAdvanceDto, UpdateMovementDto, ValidateMovementDto } from './dto/finance.dto';
import { LedgerService } from './ledger.service';
import { CashCloseService } from './cash-close.service';
import { CashCloseQuery, CloseCashDto, ListCashClosesQuery } from './dto/cash-close.dto';
export declare class FinanceController {
    private readonly ledger;
    private readonly cashClose;
    constructor(ledger: LedgerService, cashClose: CashCloseService);
    closePreview(query: CashCloseQuery, user: User): Promise<{
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
                monto: import("@prisma/client/runtime/library").Decimal;
                estado: string;
            } | null;
        } & {
            id: string;
            sucursalId: string;
            observaciones: string | null;
            cerradoAt: Date;
            cajaId: string;
            dia: string;
            saldoInicial: import("@prisma/client/runtime/library").Decimal;
            ingresosEfectivo: import("@prisma/client/runtime/library").Decimal;
            egresosEfectivo: import("@prisma/client/runtime/library").Decimal;
            efectivoEsperado: import("@prisma/client/runtime/library").Decimal;
            conteo: import("@prisma/client/runtime/library").JsonValue;
            efectivoContado: import("@prisma/client/runtime/library").Decimal;
            diferencia: import("@prisma/client/runtime/library").Decimal;
            motivoDiferencia: string | null;
            totalQr: import("@prisma/client/runtime/library").Decimal;
            totalTransferencia: import("@prisma/client/runtime/library").Decimal;
            ventasCantidad: number;
            ventasTotal: import("@prisma/client/runtime/library").Decimal;
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
            monto: import("@prisma/client/runtime/library").Decimal;
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
    closes(query: ListCashClosesQuery, user: User): Promise<({
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
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string | null;
        cerradoAt: Date;
        cajaId: string;
        dia: string;
        saldoInicial: import("@prisma/client/runtime/library").Decimal;
        ingresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        egresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        efectivoEsperado: import("@prisma/client/runtime/library").Decimal;
        conteo: import("@prisma/client/runtime/library").JsonValue;
        efectivoContado: import("@prisma/client/runtime/library").Decimal;
        diferencia: import("@prisma/client/runtime/library").Decimal;
        motivoDiferencia: string | null;
        totalQr: import("@prisma/client/runtime/library").Decimal;
        totalTransferencia: import("@prisma/client/runtime/library").Decimal;
        ventasCantidad: number;
        ventasTotal: import("@prisma/client/runtime/library").Decimal;
        cerradoPorId: string;
        revisadoPorId: string | null;
        revisadoAt: Date | null;
        revisionEstado: string | null;
        revisionMotivo: string | null;
        diferenciaMovimientoId: string | null;
    })[]>;
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
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string | null;
        cerradoAt: Date;
        cajaId: string;
        dia: string;
        saldoInicial: import("@prisma/client/runtime/library").Decimal;
        ingresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        egresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        efectivoEsperado: import("@prisma/client/runtime/library").Decimal;
        conteo: import("@prisma/client/runtime/library").JsonValue;
        efectivoContado: import("@prisma/client/runtime/library").Decimal;
        diferencia: import("@prisma/client/runtime/library").Decimal;
        motivoDiferencia: string | null;
        totalQr: import("@prisma/client/runtime/library").Decimal;
        totalTransferencia: import("@prisma/client/runtime/library").Decimal;
        ventasCantidad: number;
        ventasTotal: import("@prisma/client/runtime/library").Decimal;
        cerradoPorId: string;
        revisadoPorId: string | null;
        revisadoAt: Date | null;
        revisionEstado: string | null;
        revisionMotivo: string | null;
        diferenciaMovimientoId: string | null;
    }>;
    approveClose(id: string, user: User, sessionId?: string): Promise<{
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
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string | null;
        cerradoAt: Date;
        cajaId: string;
        dia: string;
        saldoInicial: import("@prisma/client/runtime/library").Decimal;
        ingresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        egresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        efectivoEsperado: import("@prisma/client/runtime/library").Decimal;
        conteo: import("@prisma/client/runtime/library").JsonValue;
        efectivoContado: import("@prisma/client/runtime/library").Decimal;
        diferencia: import("@prisma/client/runtime/library").Decimal;
        motivoDiferencia: string | null;
        totalQr: import("@prisma/client/runtime/library").Decimal;
        totalTransferencia: import("@prisma/client/runtime/library").Decimal;
        ventasCantidad: number;
        ventasTotal: import("@prisma/client/runtime/library").Decimal;
        cerradoPorId: string;
        revisadoPorId: string | null;
        revisadoAt: Date | null;
        revisionEstado: string | null;
        revisionMotivo: string | null;
        diferenciaMovimientoId: string | null;
    }>;
    observeClose(id: string, dto: ReasonDto, user: User, sessionId?: string): Promise<{
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
            monto: import("@prisma/client/runtime/library").Decimal;
            estado: string;
        } | null;
    } & {
        id: string;
        sucursalId: string;
        observaciones: string | null;
        cerradoAt: Date;
        cajaId: string;
        dia: string;
        saldoInicial: import("@prisma/client/runtime/library").Decimal;
        ingresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        egresosEfectivo: import("@prisma/client/runtime/library").Decimal;
        efectivoEsperado: import("@prisma/client/runtime/library").Decimal;
        conteo: import("@prisma/client/runtime/library").JsonValue;
        efectivoContado: import("@prisma/client/runtime/library").Decimal;
        diferencia: import("@prisma/client/runtime/library").Decimal;
        motivoDiferencia: string | null;
        totalQr: import("@prisma/client/runtime/library").Decimal;
        totalTransferencia: import("@prisma/client/runtime/library").Decimal;
        ventasCantidad: number;
        ventasTotal: import("@prisma/client/runtime/library").Decimal;
        cerradoPorId: string;
        revisadoPorId: string | null;
        revisadoAt: Date | null;
        revisionEstado: string | null;
        revisionMotivo: string | null;
        diferenciaMovimientoId: string | null;
    }>;
    list(query: ListMovementsQuery, user: User): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }[]>;
    export(query: ExportMovementsQuery, user: User): Promise<StreamableFile>;
    summary(mes: string | undefined, user: User): Promise<{
        cajas: {
            id: string;
            nombre: string;
            sucursal: string;
            saldo: number;
        }[];
        hoy: {
            sucursal: {
                id: string;
                nombre: string;
            };
            ventas: number;
            total: number;
            cierre: {
                diferencia: number;
            } | null;
        }[];
        cobrado: number;
        enCaja: number;
        egresosValidados: number;
        neto: number;
        porValidar: number;
        mes: string;
    }>;
    advances(user: User): Promise<{
        diasAtraso: number;
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }[]>;
    settle(id: string, dto: SettleAdvanceDto, user: User, sessionId?: string): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    custody(user: User): Promise<{
        persona: {
            id: string;
            name: string;
        } | null;
        movimientos: {
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
            monto: import("@prisma/client/runtime/library").Decimal;
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
        userId: string;
        total: number;
        cantidad: number;
    }[]>;
    get(id: string, user: User): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    impact(id: string, query: ImpactQuery, user: User): Promise<{
        efectos: ({
            caja: string;
            tipo: "caja";
            cajaId: string;
            antes: number;
            despues: number;
        } | {
            de: string | null;
            tipo: "saldo";
            antes: number;
            despues: number;
        } | {
            de: string | null;
            tipo: "costo";
            antes: number;
            despues: number;
        })[];
    }>;
    create(dto: CreateMovementDto, user: User, sessionId?: string): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    update(id: string, dto: UpdateMovementDto, user: User, sessionId?: string): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    validate(id: string, dto: ValidateMovementDto, user: User, sessionId?: string): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    observe(id: string, dto: ReasonDto, user: User, sessionId?: string): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    cancel(id: string, dto: ReasonDto, user: User, sessionId?: string): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    refund(id: string, user: User, sessionId?: string): Promise<{
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
        monto: import("@prisma/client/runtime/library").Decimal;
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
    }>;
    cashBoxes(user: User): Promise<{
        saldo: number;
        sucursal: {
            id: string;
            nombre: string;
        };
        id: string;
        nombre: string;
        tipo: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
    }[]>;
}
