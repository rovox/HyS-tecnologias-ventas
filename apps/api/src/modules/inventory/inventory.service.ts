import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { businessDayEnd, businessDayStart } from '../../common/domain/calendar';
import { canAdjustInventory, canManageInventory, canRegisterMovements, isAdmin, usesMaterialOnOwnJobs } from '../../common/policy/policy';
import { CategoriesService } from '../categories';
import { CreateProductDto, ListMovementsQuery, StockBatchDto, StockMovementDto, UpdateProductDto } from './dto/inventory.dto';
import { branchMoveError, isLowStock, kardex, movementsForDelivery, stockBySede, stockMovementError, totalStock } from './domain/inventory.rules';
import { orderCode } from '../../common/domain/codes';

type Tx = Prisma.TransactionClient;
const STOCK_SELECT = { select: { cantidad: true, sucursalOrigenId: true, sucursalDestinoId: true } } as const;
const PRODUCT_INCLUDE = { categoria: { select: { id: true, label: true } }, movements: STOCK_SELECT } satisfies Prisma.ProductInclude;
const MOVEMENT_INCLUDE = {
  producto: { select: { id: true, codigo: true, nombre: true, unidad: true } },
  sucursalOrigen: { select: { id: true, nombre: true } },
  sucursalDestino: { select: { id: true, nombre: true } },
  project: { select: { id: true, codigo: true } },
  pedidoInterno: { select: { id: true } },
  ventaDirecta: { select: { id: true, numero: true } },
  registradoPor: { select: { id: true, name: true } },
} satisfies Prisma.StockMovementInclude;
type MovementRow = Prisma.StockMovementGetPayload<{ include: typeof MOVEMENT_INCLUDE }>;
const presentMovement = (m: MovementRow) => ({ ...m, pedidoInterno: m.pedidoInterno ? { id: m.pedidoInterno.id, codigo: orderCode(m.pedidoInterno.id) } : null });

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

  /** The técnico's material goes only to a project where he has an open job (SCH-04). */
  private async assertOwnProjectJob(projectId: string | undefined, user: User) {
    const job = projectId
      ? await this.prisma.schedule.findFirst({ where: { projectId, tecnicoId: user.id, estado: { in: ['programado', 'en_proceso', 'terminado'] } }, select: { id: true } })
      : null;
    if (!job) throw new ForbiddenException('Solo registras material en los proyectos donde tienes un trabajo');
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

  /** The history (INV-03): one branch (in or out) or all, by type, Bolivian days and product; newest first. */
  async movements(user: User, query: ListMovementsQuery = {}) {
    this.assertRead(user);
    const tipos = query.tipos?.split(',').map((t) => t.trim()).filter(Boolean);
    const rows = await this.prisma.stockMovement.findMany({
      where: {
        ...(query.productoId ? { productoId: query.productoId } : {}),
        ...(tipos?.length ? { tipo: { in: tipos } } : {}),
        ...(query.sucursalId ? { OR: [{ sucursalOrigenId: query.sucursalId }, { sucursalDestinoId: query.sucursalId }] } : {}),
        ...(query.desde || query.hasta
          ? { fecha: { ...(query.desde ? { gte: businessDayStart(query.desde.slice(0, 10)) } : {}), ...(query.hasta ? { lte: businessDayEnd(query.hasta.slice(0, 10)) } : {}) } }
          : {}),
      },
      include: MOVEMENT_INCLUDE,
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
      take: 2000,
    });
    return rows.map(presentMovement);
  }

  /** Kardex of one product in a branch (or the company): what came in and out and the running balance, oldest first. */
  async kardex(productoId: string, user: User, sucursalId?: string) {
    this.assertRead(user);
    const product = await this.product(productoId);
    const rows = await this.prisma.stockMovement.findMany({ where: { productoId }, include: MOVEMENT_INCLUDE, orderBy: [{ fecha: 'asc' }, { createdAt: 'asc' }] });
    return { producto: { id: product.id, codigo: product.codigo, nombre: product.nombre, unidad: product.unidad }, movimientos: kardex(rows.map(presentMovement), sucursalId || null) };
  }

  /**
   * Who may register this movement: adjustments are Gerencia's; a técnico registers the material of his project jobs;
   * the rest is commercial, and a seller only in his branch or Central (INV-03, branchMoveError).
   */
  private async assertMove(move: { tipo: string; projectId?: string; sucursalOrigenId?: string; sucursalDestinoId?: string }, user: User) {
    if (move.tipo === 'ajuste') {
      if (!canAdjustInventory(user)) throw new ForbiddenException('Solo Gerencia o Contabilidad ajustan el inventario');
      return;
    }
    if (move.tipo === 'salida_proyecto' && usesMaterialOnOwnJobs(user)) return this.assertOwnProjectJob(move.projectId, user);
    this.assertManage(user);
    const blocked = branchMoveError(move, { manager: isAdmin(user), sucursalId: user.sucursalId });
    if (blocked) throw new ForbiddenException(blocked);
  }

  /** One movement inside a transaction: the stock is read there, so several lines of one product add up. */
  private async moveIn(tx: Tx, dto: StockMovementDto, user: User) {
    const product = await this.product(dto.productoId, tx);
    const available = dto.sucursalOrigenId ? (stockBySede(product.movements)[dto.sucursalOrigenId] ?? 0) : 0;
    const error = stockMovementError(dto, { productTipo: product.tipo, available, canAdjust: canAdjustInventory(user) });
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
  }

  /** Entradas, transfers, outputs to a project and bajas (commercial); adjustments (Gerencia). Never below zero. */
  async registerMovement(dto: StockMovementDto, user: User, sessionId?: string) {
    await this.assertMove(dto, user);
    const row = await this.prisma.$transaction((tx) => this.moveIn(tx, dto, user));
    await this.audit.record({ user, sessionId, action: `stock.${dto.tipo}`, entity: 'stock', id: row.id, affects: ['product', ...(dto.projectId ? ['project', 'client'] : [])] });
    return presentMovement(row);
  }

  /** Several products in one go (INV-03 quick actions): all lines or none; each error names its product. */
  async registerBatch(dto: StockBatchDto, user: User, sessionId?: string) {
    const { items, ...shared } = dto;
    await this.assertMove(shared, user);
    const rows = await this.prisma.$transaction(async (tx) => {
      const out: MovementRow[] = [];
      for (const item of items) {
        try {
          out.push(await this.moveIn(tx, { ...shared, ...item }, user));
        } catch (e) {
          const name = (await tx.product.findUnique({ where: { id: item.productoId }, select: { nombre: true } }))?.nombre;
          if (e instanceof BadRequestException && name) throw new BadRequestException(`${name}: ${e.message}`);
          throw e;
        }
      }
      return out;
    });
    await this.audit.record({ user, sessionId, action: `stock.${dto.tipo}`, entity: 'stock', id: rows[0].id, affects: ['product', ...(dto.projectId ? ['project', 'client'] : [])], patch: { lineas: rows.length } });
    return rows.map(presentMovement);
  }

  /**
   * Called inside the transaction that delivers an internal order: its catalog items move stock (transfer between
   * branches, or output to the project of its job). Insufficient stock rejects the delivery.
   */
  async deliverOrder(tx: Tx, pedido: { id: string; sucursalOrigenId: string | null; sucursalDestinoId: string | null; cronogramaId: string | null }, userId: string) {
    const items = await tx.pedidoInternoItem.findMany({ where: { pedidoId: pedido.id } });
    const job = pedido.cronogramaId ? await tx.schedule.findUnique({ where: { id: pedido.cronogramaId }, select: { projectId: true } }) : null;
    const plan = movementsForDelivery({ ...pedido, projectId: job?.projectId ?? null, forJob: Boolean(pedido.cronogramaId) }, items);
    if (typeof plan === 'string') throw new BadRequestException(plan);
    for (const move of plan) {
      const product = await this.product(move.productoId, tx);
      const available = stockBySede(product.movements)[move.sucursalOrigenId] ?? 0;
      const error = stockMovementError(move, { productTipo: product.tipo, available, canAdjust: false });
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
