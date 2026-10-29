import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AnnulDirectSaleDto, CreateDirectSaleDto, ListDirectSalesQuery } from './dto/direct-sale.dto';
type Tx = Prisma.TransactionClient;
export declare class DirectSalesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private assertSeller;
    list(query: ListDirectSalesQuery, user: User): Promise<{
        codigo: string;
        tieneNota: boolean;
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
        };
        items: {
            id: string;
            descripcion: string;
            codigo: string;
            subtotal: Prisma.Decimal;
            descuento: Prisma.Decimal;
            cantidad: Prisma.Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: Prisma.Decimal;
            ventaId: string;
        }[];
        cliente: {
            id: string;
            nombre: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
            phone: string;
        };
        anuladaPor: {
            id: string;
            name: string;
            phone: string;
        } | null;
        reemplazaA: {
            id: string;
            numero: number;
        } | null;
        reemplazadaPor: {
            id: string;
            numero: number;
        } | null;
        cobros: {
            id: string;
            monto: Prisma.Decimal;
            estado: string;
            caja: {
                id: string;
                nombre: string;
            } | null;
            cajaId: string | null;
            medioPago: string | null;
        }[];
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        estado: string;
        vendedorId: string;
        numero: number;
        motivoAnulacion: string | null;
        fecha: Date;
        clienteNombre: string;
        clienteCelular: string;
        clienteNit: string;
        subtotal: Prisma.Decimal;
        descuento: Prisma.Decimal;
        total: Prisma.Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
    }[]>;
    row(id: string, tx?: Tx | PrismaService): Promise<{
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
        };
        items: {
            id: string;
            descripcion: string;
            codigo: string;
            subtotal: Prisma.Decimal;
            descuento: Prisma.Decimal;
            cantidad: Prisma.Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: Prisma.Decimal;
            ventaId: string;
        }[];
        cliente: {
            id: string;
            nombre: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
            phone: string;
        };
        anuladaPor: {
            id: string;
            name: string;
            phone: string;
        } | null;
        reemplazaA: {
            id: string;
            numero: number;
        } | null;
        reemplazadaPor: {
            id: string;
            numero: number;
        } | null;
        cobros: {
            id: string;
            monto: Prisma.Decimal;
            estado: string;
            caja: {
                id: string;
                nombre: string;
            } | null;
            cajaId: string | null;
            medioPago: string | null;
        }[];
    } & {
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        estado: string;
        vendedorId: string;
        numero: number;
        motivoAnulacion: string | null;
        fecha: Date;
        clienteNombre: string;
        clienteCelular: string;
        clienteNit: string;
        subtotal: Prisma.Decimal;
        descuento: Prisma.Decimal;
        total: Prisma.Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
        notaPdfPath: string;
        notaAnuladaPdfPath: string;
    }>;
    get(id: string, user: User): Promise<{
        codigo: string;
        tieneNota: boolean;
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
        };
        items: {
            id: string;
            descripcion: string;
            codigo: string;
            subtotal: Prisma.Decimal;
            descuento: Prisma.Decimal;
            cantidad: Prisma.Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: Prisma.Decimal;
            ventaId: string;
        }[];
        cliente: {
            id: string;
            nombre: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
            phone: string;
        };
        anuladaPor: {
            id: string;
            name: string;
            phone: string;
        } | null;
        reemplazaA: {
            id: string;
            numero: number;
        } | null;
        reemplazadaPor: {
            id: string;
            numero: number;
        } | null;
        cobros: {
            id: string;
            monto: Prisma.Decimal;
            estado: string;
            caja: {
                id: string;
                nombre: string;
            } | null;
            cajaId: string | null;
            medioPago: string | null;
        }[];
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        estado: string;
        vendedorId: string;
        numero: number;
        motivoAnulacion: string | null;
        fecha: Date;
        clienteNombre: string;
        clienteCelular: string;
        clienteNit: string;
        subtotal: Prisma.Decimal;
        descuento: Prisma.Decimal;
        total: Prisma.Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
    }>;
    note(id: string, user: User, original?: boolean): Promise<{
        bytes: NonSharedBuffer;
        name: string;
    }>;
    createIn(tx: Tx, dto: CreateDirectSaleDto, user: User): Promise<{
        notaPdfPath: string;
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
        };
        items: {
            id: string;
            descripcion: string;
            codigo: string;
            subtotal: Prisma.Decimal;
            descuento: Prisma.Decimal;
            cantidad: Prisma.Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: Prisma.Decimal;
            ventaId: string;
        }[];
        cliente: {
            id: string;
            nombre: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
            phone: string;
        };
        anuladaPor: {
            id: string;
            name: string;
            phone: string;
        } | null;
        reemplazaA: {
            id: string;
            numero: number;
        } | null;
        reemplazadaPor: {
            id: string;
            numero: number;
        } | null;
        cobros: {
            id: string;
            monto: Prisma.Decimal;
            estado: string;
            caja: {
                id: string;
                nombre: string;
            } | null;
            cajaId: string | null;
            medioPago: string | null;
        }[];
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        estado: string;
        vendedorId: string;
        numero: number;
        motivoAnulacion: string | null;
        fecha: Date;
        clienteNombre: string;
        clienteCelular: string;
        clienteNit: string;
        subtotal: Prisma.Decimal;
        descuento: Prisma.Decimal;
        total: Prisma.Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
        notaAnuladaPdfPath: string;
    }>;
    create(dto: CreateDirectSaleDto, user: User, sessionId?: string): Promise<{
        codigo: string;
        tieneNota: boolean;
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
        };
        items: {
            id: string;
            descripcion: string;
            codigo: string;
            subtotal: Prisma.Decimal;
            descuento: Prisma.Decimal;
            cantidad: Prisma.Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: Prisma.Decimal;
            ventaId: string;
        }[];
        cliente: {
            id: string;
            nombre: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
            phone: string;
        };
        anuladaPor: {
            id: string;
            name: string;
            phone: string;
        } | null;
        reemplazaA: {
            id: string;
            numero: number;
        } | null;
        reemplazadaPor: {
            id: string;
            numero: number;
        } | null;
        cobros: {
            id: string;
            monto: Prisma.Decimal;
            estado: string;
            caja: {
                id: string;
                nombre: string;
            } | null;
            cajaId: string | null;
            medioPago: string | null;
        }[];
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        estado: string;
        vendedorId: string;
        numero: number;
        motivoAnulacion: string | null;
        fecha: Date;
        clienteNombre: string;
        clienteCelular: string;
        clienteNit: string;
        subtotal: Prisma.Decimal;
        descuento: Prisma.Decimal;
        total: Prisma.Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
    }>;
    annulIn(tx: Tx, id: string, dto: AnnulDirectSaleDto, user: User): Promise<{
        notaAnuladaPdfPath: string;
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
        };
        items: {
            id: string;
            descripcion: string;
            codigo: string;
            subtotal: Prisma.Decimal;
            descuento: Prisma.Decimal;
            cantidad: Prisma.Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: Prisma.Decimal;
            ventaId: string;
        }[];
        cliente: {
            id: string;
            nombre: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
            phone: string;
        };
        anuladaPor: {
            id: string;
            name: string;
            phone: string;
        } | null;
        reemplazaA: {
            id: string;
            numero: number;
        } | null;
        reemplazadaPor: {
            id: string;
            numero: number;
        } | null;
        cobros: {
            id: string;
            monto: Prisma.Decimal;
            estado: string;
            caja: {
                id: string;
                nombre: string;
            } | null;
            cajaId: string | null;
            medioPago: string | null;
        }[];
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        estado: string;
        vendedorId: string;
        numero: number;
        motivoAnulacion: string | null;
        fecha: Date;
        clienteNombre: string;
        clienteCelular: string;
        clienteNit: string;
        subtotal: Prisma.Decimal;
        descuento: Prisma.Decimal;
        total: Prisma.Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
        notaPdfPath: string;
    }>;
    annul(id: string, dto: AnnulDirectSaleDto, user: User, sessionId?: string): Promise<{
        codigo: string;
        tieneNota: boolean;
        sucursal: {
            id: string;
            nombre: string;
            direccion: string;
        };
        items: {
            id: string;
            descripcion: string;
            codigo: string;
            subtotal: Prisma.Decimal;
            descuento: Prisma.Decimal;
            cantidad: Prisma.Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: Prisma.Decimal;
            ventaId: string;
        }[];
        cliente: {
            id: string;
            nombre: string;
        } | null;
        vendedor: {
            id: string;
            name: string;
            phone: string;
        };
        anuladaPor: {
            id: string;
            name: string;
            phone: string;
        } | null;
        reemplazaA: {
            id: string;
            numero: number;
        } | null;
        reemplazadaPor: {
            id: string;
            numero: number;
        } | null;
        cobros: {
            id: string;
            monto: Prisma.Decimal;
            estado: string;
            caja: {
                id: string;
                nombre: string;
            } | null;
            cajaId: string | null;
            medioPago: string | null;
        }[];
        id: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        estado: string;
        vendedorId: string;
        numero: number;
        motivoAnulacion: string | null;
        fecha: Date;
        clienteNombre: string;
        clienteCelular: string;
        clienteNit: string;
        subtotal: Prisma.Decimal;
        descuento: Prisma.Decimal;
        total: Prisma.Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
    }>;
}
export {};
