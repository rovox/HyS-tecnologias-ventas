import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { businessDayEnd, businessDayStart } from '../../common/domain/calendar';
import { isAdmin, isVentas } from '../../common/policy/policy';
import { stockBySede } from '../inventory/domain/inventory.rules';
import { AnnulDirectSaleDto, CreateDirectSaleDto, ListDirectSalesQuery } from './dto/direct-sale.dto';
import { annulError, boxForPayment, canSellFromBranch, saleError, saleNumber, saleTotals } from './domain/direct-sales.rules';

const USER_NAME = { select: { id: true, name: true, phone: true } } as const;
export const SALE_DETAIL = {
  sucursal: { select: { id: true, nombre: true, direccion: true } },
  vendedor: USER_NAME,
  anuladaPor: USER_NAME,
  cliente: { select: { id: true, nombre: true } },
  items: true,
  cobros: { select: { id: true, medioPago: true, monto: true, estado: true, cajaId: true, caja: { select: { id: true, nombre: true } } } },
  reemplazaA: { select: { id: true, numero: true } },
  reemplazadaPor: { select: { id: true, numero: true } },
} satisfies Prisma.DirectSaleInclude;

export type SaleRow = Prisma.DirectSaleGetPayload<{ include: typeof SALE_DETAIL }>;
type Tx = Prisma.TransactionClient;

/** API shape: the sale plus its readable number (NV-0445). The stored note path stays on the server. */
export const presentSale = ({ notaPdfPath, notaAnuladaPdfPath, ...row }: SaleRow) => ({
  ...row,
  codigo: saleNumber(row.numero),
  tieneNota: Boolean(notaPdfPath),
});

/** Who sells (VD-01): Gerencia from any branch, Ventas from his branch or Central. */
const seller = (user: User) => ({ manager: isAdmin(user), seller: isVentas(user), sucursalId: user.sucursalId });

/**
 * Direct sales (business-design §4.3): products from one branch, paid on the spot. In one transaction: the global note
 * number, the stock leaving the branch (`salida_venta_directa`) and one validated payment per method in the box of
 * that method. Annulling returns the stock (`devolucion_venta`) and annuls the payments; nothing is deleted.
 */
@Injectable()
export class DirectSalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertSeller(user: User) {
    if (!isAdmin(user) && !isVentas(user)) throw new ForbiddenException('Solo ventas, Administración o Contabilidad venden');
  }

  async list(query: ListDirectSalesQuery, user: User) {
    this.assertSeller(user);
    const rows = await this.prisma.directSale.findMany({
      where: {
        ...(query.sucursalId ? { sucursalId: query.sucursalId } : {}),
        ...(query.vendedorId ? { vendedorId: query.vendedorId } : {}),
        ...(query.estado ? { estado: query.estado } : {}),
        ...(query.desde || query.hasta
          ? { fecha: { ...(query.desde ? { gte: businessDayStart(query.desde.slice(0, 10)) } : {}), ...(query.hasta ? { lte: businessDayEnd(query.hasta.slice(0, 10)) } : {}) } }
          : {}),
      },
      include: SALE_DETAIL,
      orderBy: { numero: 'desc' },
      take: 1000,
    });
    return rows.map(presentSale);
  }

  async row(id: string, tx: Tx | PrismaService = this.prisma) {
    const row = await tx.directSale.findUnique({ where: { id }, include: SALE_DETAIL });
    if (!row) throw new NotFoundException('Venta no encontrada');
    return row;
  }

  async get(id: string, user: User) {
    this.assertSeller(user);
    return presentSale(await this.row(id));
  }

  /** The sale, built and checked inside the transaction (stock and number are read under it). */
  async createIn(tx: Tx, dto: CreateDirectSaleDto, user: User) {
    this.assertSeller(user);
    if (!canSellFromBranch(seller(user), dto.sucursalId)) throw new ForbiddenException('Vendes desde tu sucursal o desde Central');
    const sucursal = await tx.sucursal.findUnique({ where: { id: dto.sucursalId } });
    if (!sucursal) throw new BadRequestException('Sucursal no encontrada');
    const client = dto.clienteId ? await tx.client.findUnique({ where: { id: dto.clienteId } }) : null;
    if (dto.clienteId && !client) throw new BadRequestException('Cliente no encontrado');
    if (dto.reemplazaAId) {
      const replaced = await tx.directSale.findUnique({ where: { id: dto.reemplazaAId }, include: { reemplazadaPor: { select: { id: true } } } });
      if (!replaced || replaced.estado !== 'anulada') throw new BadRequestException('Solo se reemplaza una venta anulada');
      if (replaced.reemplazadaPor) throw new BadRequestException('Esa venta ya tiene su reemplazo');
    }

    const ids = [...new Set(dto.items.map((i) => i.productoId))];
    const products = await tx.product.findMany({ where: { id: { in: ids } }, include: { movements: { select: { cantidad: true, sucursalOrigenId: true, sucursalDestinoId: true } } } });
    const byId = new Map(products.map((p) => [p.id, p]));
    for (const id of ids) {
      const p = byId.get(id);
      if (!p || !p.active) throw new BadRequestException('Producto no encontrado o archivado');
      if (p.tipo === 'servicio') throw new BadRequestException(`${p.nombre} es un servicio: no tiene stock que vender`);
    }
    const available = Object.fromEntries(products.map((p) => [p.id, stockBySede(p.movements)[dto.sucursalId] ?? 0]));
    const descuento = dto.descuento ?? 0;
    const error = saleError(dto.items, descuento, dto.pagos, available);
    if (error) throw new BadRequestException(error);

    const boxes = await tx.cashBox.findMany();
    const payments = dto.pagos.map((p) => ({ ...p, cajaId: boxForPayment(p.medio, dto.sucursalId, boxes) }));
    const missing = payments.find((p) => !p.cajaId);
    if (missing) throw new BadRequestException(`No hay caja para cobros por ${missing.medio} en esta sucursal: pide a Gerencia que la cree`);

    const counter = await tx.docCounter.upsert({ where: { id: 'nota_venta' }, create: { id: 'nota_venta', valor: 1 }, update: { valor: { increment: 1 } } });
    const totals = saleTotals(dto.items, descuento);
    const now = new Date();
    const sale = await tx.directSale.create({
      data: {
        numero: counter.valor,
        sucursalId: dto.sucursalId,
        vendedorId: user.id,
        clienteId: client?.id ?? null,
        clienteNombre: dto.clienteNombre?.trim() || client?.nombre || 'Cliente varios',
        clienteCelular: dto.clienteCelular?.trim() || client?.telefono || '',
        clienteNit: dto.clienteNit?.trim() || '',
        subtotal: totals.subtotal,
        descuento: totals.descuento,
        total: totals.total,
        reemplazaAId: dto.reemplazaAId ?? null,
        fecha: now,
        items: {
          create: totals.items.map((line, i) => {
            const p = byId.get(dto.items[i].productoId)!;
            return { productoId: p.id, codigo: p.codigo, descripcion: p.nombre.slice(0, 300), unidad: p.unidad, cantidad: line.cantidad, precioUnitario: line.precioUnitario, descuento: line.descuento, subtotal: line.subtotal };
          }),
        },
      },
    });
    const code = saleNumber(sale.numero);
    await tx.stockMovement.createMany({
      data: dto.items.map((line) => ({
        productoId: line.productoId,
        tipo: 'salida_venta_directa',
        cantidad: line.cantidad,
        costoUnitario: byId.get(line.productoId)!.costo,
        sucursalOrigenId: dto.sucursalId,
        ventaDirectaId: sale.id,
        nota: `Venta ${code}`,
        registradoPorId: user.id,
        fecha: now,
      })),
    });
    await tx.cashMovement.createMany({
      data: payments.map((p) => ({
        tipo: 'ingreso',
        concepto: 'venta_directa',
        monto: p.monto,
        metodo: p.medio,
        medioPago: p.medio,
        nota: `Venta ${code}`,
        fecha: now,
        // A direct sale is validated at once (owner 2026-10-27): it goes straight into the box of its method.
        estado: 'validado',
        cajaId: p.cajaId,
        sucursalId: dto.sucursalId,
        clienteId: client?.id ?? null,
        ventaDirectaId: sale.id,
        registradoPorId: user.id,
        recibidoPorId: user.id,
        validadoPorId: user.id,
        validadoAt: now,
      })),
    });
    return this.row(sale.id, tx);
  }

  async create(dto: CreateDirectSaleDto, user: User, sessionId?: string) {
    const sale = await this.prisma.$transaction((tx) => this.createIn(tx, dto, user));
    await this.audit.record({ user, sessionId, action: 'directSale.create', entity: 'directSale', id: sale.id, affects: ['product', 'stock', 'movement', 'client'], patch: { estado: sale.estado } });
    return presentSale(sale);
  }

  /** Gerencia (Administración, Contabilidad) annuls with a reason: the stock comes back and the payments leave their boxes. */
  async annulIn(tx: Tx, id: string, dto: AnnulDirectSaleDto, user: User) {
    if (!isAdmin(user)) throw new ForbiddenException('Solo Administración o Contabilidad anulan una venta');
    const sale = await this.row(id, tx);
    const error = annulError(sale, dto.motivo);
    if (error) throw new BadRequestException(error);
    const now = new Date();
    const code = saleNumber(sale.numero);
    await tx.stockMovement.createMany({
      data: sale.items.map((line) => ({
        productoId: line.productoId,
        tipo: 'devolucion_venta',
        cantidad: line.cantidad,
        sucursalDestinoId: sale.sucursalId,
        ventaDirectaId: sale.id,
        motivo: dto.motivo.trim(),
        nota: `Anulación de ${code}`,
        registradoPorId: user.id,
        fecha: now,
      })),
    });
    await tx.cashMovement.updateMany({ where: { ventaDirectaId: sale.id, estado: { not: 'anulado' } }, data: { estado: 'anulado', motivo: `Venta ${code} anulada: ${dto.motivo.trim()}` } });
    await tx.directSale.update({ where: { id }, data: { estado: 'anulada', motivoAnulacion: dto.motivo.trim(), anuladaPorId: user.id, anuladaAt: now } });
    return this.row(id, tx);
  }

  async annul(id: string, dto: AnnulDirectSaleDto, user: User, sessionId?: string) {
    const before = await this.row(id);
    const sale = await this.prisma.$transaction((tx) => this.annulIn(tx, id, dto, user));
    await this.audit.record({ user, sessionId, action: 'directSale.annul', entity: 'directSale', id, before: { estado: before.estado }, after: { estado: sale.estado, motivo: dto.motivo }, affects: ['product', 'stock', 'movement', 'client'] });
    return presentSale(sale);
  }
}
