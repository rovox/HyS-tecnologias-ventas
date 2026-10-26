import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { SchedulesService } from '../schedules';
import { IncomeService } from '../finance';
import { CreateProjectJobDto, ListProjectsQuery, ProjectAmountDto, ProjectPaymentDto, ProjectStatusDto, UpdateProjectDto } from './dto/project.dto';
import { type JobOptions } from './domain/projects.rules';
type Tx = Prisma.TransactionClient;
type ApprovedQuote = {
    id: string;
    numero: string;
    titulo: string;
    categoriaId: string;
    monto: number;
    clienteId: string;
    sucursalId: string;
    vendedorId?: string | null;
    cliente?: {
        direccion?: string | null;
    } | null;
};
export declare class ProjectsService {
    private readonly prisma;
    private readonly audit;
    private readonly schedules;
    private readonly income;
    constructor(prisma: PrismaService, audit: AuditService, schedules: SchedulesService, income: IncomeService);
    list(query: ListProjectsQuery, user: User): Promise<{
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            productoId: string;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
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
    }[]>;
    private row;
    get(id: string, user: User): Promise<{
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            productoId: string;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
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
    }>;
    createFromQuotation(tx: Tx, quote: ApprovedQuote, options: JobOptions): Promise<{
        project: {
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
        schedule: {
            id: string;
            sucursalId: string;
            observaciones: string;
            mapsLink: string;
            createdAt: Date;
            updatedAt: Date;
            tecnicoId: string | null;
            vendedorId: string | null;
            clienteId: string;
            categoriaId: string;
            monto: Prisma.Decimal;
            estado: string;
            fechaProgramada: Date;
            lugar: string;
            horario: string | null;
            quotationId: string | null;
            descripcionTrabajo: string;
            adelanto: Prisma.Decimal;
            fechaFinalizacion: Date | null;
            saldo: Prisma.Decimal;
            projectId: string | null;
            fotosUrl: Prisma.JsonValue | null;
        };
    }>;
    update(id: string, dto: UpdateProjectDto, user: User, sessionId?: string): Promise<{
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            productoId: string;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
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
    }>;
    changeStatus(id: string, dto: ProjectStatusDto, user: User, sessionId?: string): Promise<{
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            productoId: string;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
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
    }>;
    addJob(id: string, dto: CreateProjectJobDto, user: User, sessionId?: string): Promise<{
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            productoId: string;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
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
    }>;
    registerPayment(id: string, dto: ProjectPaymentDto, user: User, sessionId?: string): Promise<{
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            productoId: string;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
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
    }>;
    changeAmount(id: string, dto: ProjectAmountDto, user: User, sessionId?: string): Promise<{
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            reembolsadoAt: Date | null;
            comprobanteUrl: string | null;
            reversaDeId: string | null;
            registradoPorId: string;
            validadoPorId: string | null;
            validadoAt: Date | null;
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
            productoId: string;
            cantidad: Prisma.Decimal;
            costoUnitario: Prisma.Decimal;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
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
    }>;
}
export {};
