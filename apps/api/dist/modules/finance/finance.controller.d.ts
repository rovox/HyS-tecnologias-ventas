import type { User } from '@prisma/client';
import { CreateMovementDto, ImpactQuery, ListMovementsQuery, ReasonDto, UpdateMovementDto, ValidateMovementDto } from './dto/finance.dto';
import { LedgerService } from './ledger.service';
export declare class FinanceController {
    private readonly ledger;
    constructor(ledger: LedgerService);
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
    }[]>;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
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
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
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
