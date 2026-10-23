import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { canAdjustInventory, canManageInventory, canRegisterMovements } from '../../common/policy/policy';
import { CategoriesService } from '../categories';
import { CreateProductDto, StockMovementDto, UpdateProductDto } from './dto/inventory.dto';
import { isLowStock, movementsForDelivery, stockBySede, stockMovementError, totalStock } from './domain/inventory.rules';

type Tx = Prisma.TransactionClient;
const STOCK_SELECT = { select: { cantidad: true, sucursalOrigenId: true, sucursalDestinoId: true } } as const;
const PRODUCT_INCLUDE = { categoria: { select: { id: true, label: true } }, movements: STOCK_SELECT } satisfies Prisma.ProductInclude;
const MOVEMENT_INCLUDE = {
  producto: { select: { id: true, codigo: true, nombre: true, unidad: true } },
  sucursalOrigen: { select: { id: true, nombre: true } },
  sucursalDestino: { select: { id: true, nombre: true } },
  project: { select: { id: true, codigo: true } },
  pedidoInterno: { select: { id: true } },
  registradoPor: { select: { id: true, name: true } },
} satisfies Prisma.StockMovementInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

/** API shape: the product with its stock per branch, total and low-stock flag (computed, never stored). */
function presentProduct(row: ProductRow) {
  const { movements, ...product } = row;
  const stock = stockBySede(movements);
  const total = totalStock(stock);
  return { ...product, stock, stockTotal: total, stockBajo: isLowStock(row, total) };
}

/** Inventory: product catalog, stock per branch from movements, and the stock moved when an order is delivered. */
@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly categories: CategoriesService,
  ) {}

  private assertRead(user: User) {
    if (!canRegisterMovements(user)) throw new ForbiddenException('Sin acceso al inventario');
  }

  private assertManage(user: User) {
    if (!canManageInventory(user)) throw new ForbiddenException('Solo ventas o Gerencia gestionan el inventario');
  }

  async products(user: User) {
    this.assertRead(user);
    const rows = await this.prisma.product.findMany({ include: PRODUCT_INCLUDE, orderBy: [{ active: 'desc' }, { nombre: 'asc' }] });
    return rows.map(presentProduct);
  }

  private async product(id: string, db: Tx | PrismaService = this.prisma) {
    const row = await db.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
    if (!row) throw new NotFoundException('Producto no encontrado');
    return row;
  }

  async createProduct(dto: CreateProductDto, user: User, sessionId?: string) {
    this.assertManage(user);
    await this.categories.assertDivision(dto.categoriaId);
    const codigo = dto.codigo.trim().toUpperCase();
    if (await this.prisma.product.findUnique({ where: { codigo } })) throw new ConflictException(`Ya existe un producto con el código ${codigo}`);
    const row = await this.prisma.product.create({
      data: { ...dto, codigo, nombre: dto.nombre.trim(), marca: dto.marca?.trim() || '', unidad: dto.unidad || 'unidad' },
      include: PRODUCT_INCLUDE,
    });
    await this.audit.record({ user, sessionId, action: 'product.create', entity: 'product', id: row.id });
    return presentProduct(row);
  }

  async updateProduct(id: string, dto: UpdateProductDto, user: User, sessionId?: string) {
    this.assertManage(user);
    const before = await this.product(id);
    if (dto.categoriaId !== undefined) await this.categories.assertDivision(dto.categoriaId);
    const after = await this.prisma.product.update({ where: { id }, data: dto, include: PRODUCT_INCLUDE });
    await this.audit.record({ user, sessionId, action: 'product.update', entity: 'product', id, before, after });
    return presentProduct(after);
  }

  async movements(user: User, productoId?: string) {
    this.assertRead(user);
    return this.prisma.stockMovement.findMany({
      where: productoId ? { productoId } : {},
      include: MOVEMENT_INCLUDE,
      orderBy: { fecha: 'desc' },
      take: 1000,
    });
  }

  /** Entradas, transfers and outputs to a project (commercial); adjustments (Gerencia). Never below zero. */
  async registerMovement(dto: StockMovementDto, user: User, sessionId?: string) {
    this.assertManage(user);
    const row = await this.prisma.$transaction(async (tx) => {
      const product = await this.product(dto.productoId, tx);
      const available = dto.sucursalOrigenId ? (stockBySede(product.movements)[dto.sucursalOrigenId] ?? 0) : 0;
      const error = stockMovementError(dto, { productTipo: product.tipo, available, isAdmin: canAdjustInventory(user) });
      if (error) throw new BadRequestException(error);
      if (dto.projectId) {
        const project = await tx.project.findUnique({ where: { id: dto.projectId } });
        if (!project || ['cerrado', 'anulado'].includes(project.estado)) throw new BadRequestException('El proyecto no existe o está cerrado');
      }
      const purchase = dto.tipo === 'entrada' && dto.costoUnitario !== undefined;
      if (purchase) await tx.product.update({ where: { id: product.id }, data: { costo: dto.costoUnitario } });
      return tx.stockMovement.create({
        data: {
          productoId: product.id,
          tipo: dto.tipo,
          cantidad: dto.cantidad,
          costoUnitario: purchase ? dto.costoUnitario! : product.costo,
          sucursalOrigenId: dto.sucursalOrigenId ?? null,
          sucursalDestinoId: dto.sucursalDestinoId ?? null,
          projectId: dto.projectId ?? null,
          motivo: dto.motivo?.trim() || null,
          nota: dto.nota || '',
          registradoPorId: user.id,
        },
        include: MOVEMENT_INCLUDE,
      });
    });
    await this.audit.record({ user, sessionId, action: `stock.${dto.tipo}`, entity: 'stock', id: row.id, affects: ['product', ...(dto.projectId ? ['project'] : [])] });
    return row;
  }

  /**
   * Called inside the transaction that delivers an internal order: its catalog items move stock (transfer between
   * branches, or output to the project of its job). Insufficient stock rejects the delivery.
   */
  async deliverOrder(tx: Tx, pedido: { id: string; sucursalOrigenId: string | null; sucursalDestinoId: string | null; cronogramaId: string | null }, userId: string) {
    const items = await tx.pedidoInternoItem.findMany({ where: { pedidoId: pedido.id } });
    const job = pedido.cronogramaId ? await tx.schedule.findUnique({ where: { id: pedido.cronogramaId }, select: { projectId: true } }) : null;
    const plan = movementsForDelivery({ ...pedido, projectId: job?.projectId ?? null }, items);
    if (typeof plan === 'string') throw new BadRequestException(plan);
    for (const move of plan) {
      const product = await this.product(move.productoId, tx);
      const available = stockBySede(product.movements)[move.sucursalOrigenId] ?? 0;
      const error = stockMovementError(move, { productTipo: product.tipo, available, isAdmin: false });
      if (error) throw new BadRequestException(`${product.nombre}: ${error}`);
      await tx.stockMovement.create({ data: { ...move, costoUnitario: product.costo, pedidoInternoId: pedido.id, registradoPorId: userId } });
    }
    return plan.length;
  }

  /** Order items may point to catalog products: they must exist and be active. */
  async assertProducts(ids: string[]) {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return;
    const found = await this.prisma.product.count({ where: { id: { in: unique }, active: true } });
    if (found !== unique.length) throw new BadRequestException('Un producto del pedido no existe o está archivado');
  }
}
