import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CategoriesService } from '../categories';
import { CreateProductDto, StockMovementDto, UpdateProductDto } from './dto/inventory.dto';
type Tx = Prisma.TransactionClient;
export declare class InventoryService {
    private readonly prisma;
    private readonly audit;
    private readonly categories;
    constructor(prisma: PrismaService, audit: AuditService, categories: CategoriesService);
    private assertRead;
    private assertManage;
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
        costo: Prisma.Decimal;
        marca: string;
        unidad: string;
        precio: Prisma.Decimal;
        stockMinimo: Prisma.Decimal;
    }[]>;
    private product;
    createProduct(dto: CreateProductDto, user: User, sessionId?: string): Promise<{
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
        costo: Prisma.Decimal;
        marca: string;
        unidad: string;
        precio: Prisma.Decimal;
        stockMinimo: Prisma.Decimal;
    }>;
    updateProduct(id: string, dto: UpdateProductDto, user: User, sessionId?: string): Promise<{
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
        costo: Prisma.Decimal;
        marca: string;
        unidad: string;
        precio: Prisma.Decimal;
        stockMinimo: Prisma.Decimal;
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
        cantidad: Prisma.Decimal;
        costoUnitario: Prisma.Decimal;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        pedidoInternoId: string | null;
    }[]>;
    registerMovement(dto: StockMovementDto, user: User, sessionId?: string): Promise<{
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
        cantidad: Prisma.Decimal;
        costoUnitario: Prisma.Decimal;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        pedidoInternoId: string | null;
    }>;
    deliverOrder(tx: Tx, pedido: {
        id: string;
        sucursalOrigenId: string | null;
        sucursalDestinoId: string | null;
        cronogramaId: string | null;
    }, userId: string): Promise<number>;
    assertProducts(ids: string[]): Promise<void>;
}
export {};
