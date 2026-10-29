import { StreamableFile } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AnnulDirectSaleDto, CreateDirectSaleDto, ListDirectSalesQuery } from './dto/direct-sale.dto';
import { DirectSalesService } from './direct-sales.service';
export declare class DirectSalesController {
    private readonly sales;
    constructor(sales: DirectSalesService);
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
            subtotal: import("@prisma/client/runtime/library").Decimal;
            descuento: import("@prisma/client/runtime/library").Decimal;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: import("@prisma/client/runtime/library").Decimal;
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
            monto: import("@prisma/client/runtime/library").Decimal;
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
        subtotal: import("@prisma/client/runtime/library").Decimal;
        descuento: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
    }[]>;
    note(id: string, original: string | undefined, user: User): Promise<StreamableFile>;
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
            subtotal: import("@prisma/client/runtime/library").Decimal;
            descuento: import("@prisma/client/runtime/library").Decimal;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: import("@prisma/client/runtime/library").Decimal;
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
            monto: import("@prisma/client/runtime/library").Decimal;
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
        subtotal: import("@prisma/client/runtime/library").Decimal;
        descuento: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
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
            subtotal: import("@prisma/client/runtime/library").Decimal;
            descuento: import("@prisma/client/runtime/library").Decimal;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: import("@prisma/client/runtime/library").Decimal;
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
            monto: import("@prisma/client/runtime/library").Decimal;
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
        subtotal: import("@prisma/client/runtime/library").Decimal;
        descuento: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
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
            subtotal: import("@prisma/client/runtime/library").Decimal;
            descuento: import("@prisma/client/runtime/library").Decimal;
            cantidad: import("@prisma/client/runtime/library").Decimal;
            unidad: string;
            productoId: string;
            precioUnitario: import("@prisma/client/runtime/library").Decimal;
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
            monto: import("@prisma/client/runtime/library").Decimal;
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
        subtotal: import("@prisma/client/runtime/library").Decimal;
        descuento: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        anuladaPorId: string | null;
        anuladaAt: Date | null;
        reemplazaAId: string | null;
    }>;
}
