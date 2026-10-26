import type { User } from '@prisma/client';
import { CreateProductDto, StockMovementDto, UpdateProductDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventory;
    constructor(inventory: InventoryService);
    products(user: User): Promise<{
        stock: Record<string, number>;
        stockTotal: number;
        stockBajo: boolean;
        categoria: {
            id: string;
            label: string;
        };
        id: string;
        nombre: string;
        tipo: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        categoriaId: string;
        codigo: string;
        costo: import("@prisma/client/runtime/library").Decimal;
        marca: string;
        unidad: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        stockMinimo: import("@prisma/client/runtime/library").Decimal;
    }[]>;
    create(dto: CreateProductDto, user: User, sessionId?: string): Promise<{
        stock: Record<string, number>;
        stockTotal: number;
        stockBajo: boolean;
        categoria: {
            id: string;
            label: string;
        };
        id: string;
        nombre: string;
        tipo: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        categoriaId: string;
        codigo: string;
        costo: import("@prisma/client/runtime/library").Decimal;
        marca: string;
        unidad: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        stockMinimo: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateProductDto, user: User, sessionId?: string): Promise<{
        stock: Record<string, number>;
        stockTotal: number;
        stockBajo: boolean;
        categoria: {
            id: string;
            label: string;
        };
        id: string;
        nombre: string;
        tipo: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        categoriaId: string;
        codigo: string;
        costo: import("@prisma/client/runtime/library").Decimal;
        marca: string;
        unidad: string;
        precio: import("@prisma/client/runtime/library").Decimal;
        stockMinimo: import("@prisma/client/runtime/library").Decimal;
    }>;
    movements(user: User, productoId?: string): Promise<{
        pedidoInterno: {
            id: string;
            codigo: string;
        } | null;
        project: {
            id: string;
            codigo: string;
        } | null;
        registradoPor: {
            id: string;
            name: string;
        };
        producto: {
            id: string;
            nombre: string;
            codigo: string;
            unidad: string;
        };
        sucursalOrigen: {
            id: string;
            nombre: string;
        } | null;
        sucursalDestino: {
            id: string;
            nombre: string;
        } | null;
        id: string;
        tipo: string;
        createdAt: Date;
        motivo: string | null;
        nota: string;
        fecha: Date;
        projectId: string | null;
        registradoPorId: string;
        productoId: string;
        cantidad: import("@prisma/client/runtime/library").Decimal;
        costoUnitario: import("@prisma/client/runtime/library").Decimal;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        pedidoInternoId: string | null;
    }[]>;
    move(dto: StockMovementDto, user: User, sessionId?: string): Promise<{
        pedidoInterno: {
            id: string;
        } | null;
        project: {
            id: string;
            codigo: string;
        } | null;
        registradoPor: {
            id: string;
            name: string;
        };
        producto: {
            id: string;
            nombre: string;
            codigo: string;
            unidad: string;
        };
        sucursalOrigen: {
            id: string;
            nombre: string;
        } | null;
        sucursalDestino: {
            id: string;
            nombre: string;
        } | null;
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
        cantidad: import("@prisma/client/runtime/library").Decimal;
        costoUnitario: import("@prisma/client/runtime/library").Decimal;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        pedidoInternoId: string | null;
    }>;
}
