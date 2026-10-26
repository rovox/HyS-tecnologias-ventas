import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateMovementDto, ImpactQuery, ListMovementsQuery, UpdateMovementDto } from './dto/finance.dto';
export declare class LedgerService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private assertValidator;
    private row;
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
    }[]>;
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
    }>;
    transition(id: string, to: 'validado' | 'observado' | 'anulado', input: {
        cajaId?: string;
        motivo?: string;
    }, user: User, sessionId?: string): Promise<{
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
        }[];
        userId: string;
        total: number;
        cantidad: number;
    }[]>;
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
    private target;
    private assertBox;
    private assertActiveUser;
    private affects;
}
