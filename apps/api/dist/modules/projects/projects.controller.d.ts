import type { User } from '@prisma/client';
import { CreateProjectJobDto, ListProjectsQuery, ProjectAmountDto, ProjectPaymentDto, ProjectStatusDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';
export declare class ProjectsController {
    private readonly projects;
    constructor(projects: ProjectsService);
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
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            costoUnitario: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
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
        montoOficial: import("@prisma/client/runtime/library").Decimal;
        motivoAnulacion: string | null;
        garantiaMeses: number;
        entregadoAt: Date | null;
        cerradoAt: Date | null;
        responsableId: string | null;
    }[]>;
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
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            costoUnitario: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
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
        montoOficial: import("@prisma/client/runtime/library").Decimal;
        motivoAnulacion: string | null;
        garantiaMeses: number;
        entregadoAt: Date | null;
        cerradoAt: Date | null;
        responsableId: string | null;
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
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            costoUnitario: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
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
        montoOficial: import("@prisma/client/runtime/library").Decimal;
        motivoAnulacion: string | null;
        garantiaMeses: number;
        entregadoAt: Date | null;
        cerradoAt: Date | null;
        responsableId: string | null;
    }>;
    status(id: string, dto: ProjectStatusDto, user: User, sessionId?: string): Promise<{
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
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            costoUnitario: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
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
        montoOficial: import("@prisma/client/runtime/library").Decimal;
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
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            costoUnitario: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
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
        montoOficial: import("@prisma/client/runtime/library").Decimal;
        motivoAnulacion: string | null;
        garantiaMeses: number;
        entregadoAt: Date | null;
        cerradoAt: Date | null;
        responsableId: string | null;
    }>;
    amount(id: string, dto: ProjectAmountDto, user: User, sessionId?: string): Promise<{
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
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            costoUnitario: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
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
        montoOficial: import("@prisma/client/runtime/library").Decimal;
        motivoAnulacion: string | null;
        garantiaMeses: number;
        entregadoAt: Date | null;
        cerradoAt: Date | null;
        responsableId: string | null;
    }>;
    pay(id: string, dto: ProjectPaymentDto, user: User, sessionId?: string): Promise<{
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
            ventaDirectaId: string | null;
            sucursalOrigenId: string | null;
            sucursalDestinoId: string | null;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            costoUnitario: import("@prisma/client/runtime/library").Decimal;
            productoId: string;
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
        montoOficial: import("@prisma/client/runtime/library").Decimal;
        motivoAnulacion: string | null;
        garantiaMeses: number;
        entregadoAt: Date | null;
        cerradoAt: Date | null;
        responsableId: string | null;
    }>;
}
