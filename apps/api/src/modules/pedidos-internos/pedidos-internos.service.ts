import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { checkTransition, deleteError, deliveryFields, transitionNeedsReason } from './domain/pedidos-internos.rules';
import { PEDIDO_INCLUDE, presentPedidos } from './pedido.presenter';
import { InventoryService } from '../inventory';
import { canManagePedidos, canSeePedidos } from '../../common/policy/policy';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { AddComentarioDto, UpdateEstadoPedidoDto, UpsertPedidoInternoDto } from './dto/pedido-interno.dto';

@Injectable()
export class PedidosInternosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventory: InventoryService,
  ) {}

  private assertCanManage(user: User) {
    if (!canManagePedidos(user)) throw new ForbiddenException('Sin acceso a pedidos internos');
  }

  private assertCanSee(user: User) {
    if (!canSeePedidos(user)) throw new ForbiddenException('Sin acceso a pedidos internos');
  }

  /** Audit row with the field diff (who changed what) and the realtime event: the order page shows it as history. */
  private emit(type: string, id: string, user: User, sessionId: string | undefined, extra: { before?: object | null; after?: object | null; affects?: string[] } = {}) {
    return this.audit.record({
      user,
      sessionId,
      action: `pedido_interno.${type}`,
      entity: 'pedido_interno',
      id,
      before: extra.before as Record<string, unknown> | null | undefined,
      after: extra.after as Record<string, unknown> | null | undefined,
      affects: extra.affects ?? [],
    });
  }

  /** Delivering moves the stock of its catalog items in the same transaction (or nothing changes). */
  private async deliver(tx: Prisma.TransactionClient, id: string, user: User) {
    const pedido = await tx.pedidoInterno.findUniqueOrThrow({ where: { id } });
    return this.inventory.deliverOrder(tx, pedido, user.id);
  }

  private assertTransition(from: string, to: string) {
    const check = checkTransition(from, to);
    if (!check.ok) throw new BadRequestException(check.reason);
  }

  async findAll(user: User, query: Record<string, string>) {
    this.assertCanSee(user);
    const { estado, search, prioridad, sucursal } = query;

    const where: Record<string, unknown> = {};
    if (estado) where.estado = estado;
    if (prioridad) where.prioridad = prioridad;
    if (sucursal) where.sucursalOrigenId = sucursal;
    if (search) {
      where.OR = [
        { observaciones: { contains: search } },
        { items: { some: { materialNombre: { contains: search } } } },
      ];
    }

    const rows = await this.prisma.pedidoInterno.findMany({ where, include: PEDIDO_INCLUDE, orderBy: { createdAt: 'desc' } });
    return presentPedidos(this.prisma, rows);
  }

  /** The order with its items, comments and the stock movements its delivery made. */
  async findOne(id: string, user: User) {
    this.assertCanSee(user);
    const row = await this.prisma.pedidoInterno.findUnique({ where: { id }, include: PEDIDO_INCLUDE });
    if (!row) throw new NotFoundException('Pedido interno no encontrado');
    const [[pedido], comentarios, movimientos] = await Promise.all([
      presentPedidos(this.prisma, [row]),
      this.prisma.pedidoInternoComentario.findMany({
        where: { pedidoId: id },
        orderBy: { createdAt: 'asc' },
        include: { autor: { select: { id: true, name: true } } },
      }),
      this.prisma.stockMovement.findMany({
        where: { pedidoInternoId: id },
        orderBy: { fecha: 'asc' },
        include: { producto: { select: { id: true, codigo: true, nombre: true, unidad: true } } },
      }),
    ]);
    return { ...pedido, comentarios, movimientos };
  }

  async create(dto: UpsertPedidoInternoDto, user: User, sessionId?: string) {
    this.assertCanManage(user);
    const { items, ...pedidoData } = dto;
    await this.inventory.assertProducts((items || []).map((i) => i.productoId || ''));

    const pedido = await this.prisma.pedidoInterno.create({
      data: {
        responsableId: pedidoData.responsableId || user.id,
        solicitanteId: user.id,
        sucursalOrigenId: pedidoData.sucursalOrigenId,
        // An order goes to a branch or to a job: the other one is null, never ''.
        sucursalDestinoId: pedidoData.sucursalDestinoId || null,
        cronogramaId: pedidoData.cronogramaId || null,
        prioridad: pedidoData.prioridad || 'Normal',
        estado: pedidoData.estado || 'solicitado',
        fechaEntregaEstimada: pedidoData.fechaEntregaEstimada
          ? new Date(pedidoData.fechaEntregaEstimada)
          : null,
        observaciones: pedidoData.observaciones,
        items: items?.length
          ? {
              create: items.map((item) => ({
                productoId: item.productoId || null,
                materialNombre: item.materialNombre,
                cantidad: item.cantidad,
                unidad: item.unidad || 'unidades',
                costoUnitario: item.costoUnitario,
                observaciones: item.observaciones,
              })),
            }
          : undefined,
      },
      include: PEDIDO_INCLUDE,
    });

    await this.emit('created', pedido.id, user, sessionId);
    return (await presentPedidos(this.prisma, [pedido]))[0];
  }

  async update(id: string, dto: UpsertPedidoInternoDto, user: User, sessionId?: string) {
    this.assertCanManage(user);
    const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido interno no encontrado');
    if (dto.estado && dto.estado !== existing.estado) this.assertTransition(existing.estado, dto.estado);

    const { items, ...pedidoData } = dto;
    if (items) await this.inventory.assertProducts(items.map((i) => i.productoId || ''));
    const delivering = dto.estado === 'entregado' && existing.estado !== 'entregado';

    await this.prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.pedidoInternoItem.deleteMany({ where: { pedidoId: id } });
      }

      await tx.pedidoInterno.update({
        where: { id },
        data: {
          ...(pedidoData.responsableId && { responsableId: pedidoData.responsableId }),
          ...(pedidoData.sucursalOrigenId !== undefined && { sucursalOrigenId: pedidoData.sucursalOrigenId }),
          ...(pedidoData.sucursalDestinoId !== undefined && { sucursalDestinoId: pedidoData.sucursalDestinoId || null }),
          ...(pedidoData.cronogramaId !== undefined && { cronogramaId: pedidoData.cronogramaId || null }),
          ...(pedidoData.prioridad && { prioridad: pedidoData.prioridad }),
          ...(pedidoData.estado && { estado: pedidoData.estado }),
          ...(pedidoData.fechaEntregaEstimada !== undefined && {
            fechaEntregaEstimada: pedidoData.fechaEntregaEstimada
              ? new Date(pedidoData.fechaEntregaEstimada)
              : null,
          }),
          ...(pedidoData.observaciones !== undefined && { observaciones: pedidoData.observaciones }),
          ...(items !== undefined && {
            items: {
              create: items.map((item) => ({
                productoId: item.productoId || null,
                materialNombre: item.materialNombre,
                cantidad: item.cantidad,
                unidad: item.unidad || 'unidades',
                costoUnitario: item.costoUnitario,
                observaciones: item.observaciones,
              })),
            },
          }),
        },
      });
      if (delivering) await this.deliver(tx, id, user);
    });

    const after = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    await this.emit('update', id, user, sessionId, { before: existing, after, affects: delivering ? ['stock', 'product', 'project', 'client'] : [] });
    return this.findOne(id, user);
  }

  async remove(id: string, user: User, sessionId?: string) {
    this.assertCanManage(user);
    const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido interno no encontrado');
    const blocked = deleteError(existing.estado);
    if (blocked) throw new BadRequestException(blocked);

    await this.prisma.pedidoInterno.delete({ where: { id } });
    await this.emit('delete', id, user, sessionId);
    return { ok: true };
  }

  /** A state change; rejecting or cancelling needs a reason, kept as a comment. Delivering moves the stock. */
  async updateEstado(id: string, dto: UpdateEstadoPedidoDto, user: User, sessionId?: string) {
    this.assertCanManage(user);
    const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido interno no encontrado');
    this.assertTransition(existing.estado, dto.estado);
    const motivo = dto.observacion?.trim();
    if (transitionNeedsReason(dto.estado) && !motivo) throw new BadRequestException('Indica el motivo');

    const data = {
      estado: dto.estado,
      ...deliveryFields(dto.estado, { fechaEntrega: dto.fecha_entrega, entregadoPorId: dto.entregado_por_id }, user.id, new Date()),
    };

    const delivering = dto.estado === 'entregado';
    const after = await this.prisma.$transaction(async (tx) => {
      const row = await tx.pedidoInterno.update({ where: { id }, data });
      if (delivering) await this.deliver(tx, id, user);
      if (motivo) await tx.pedidoInternoComentario.create({ data: { pedidoId: id, autorId: user.id, contenido: `${dto.estado === 'rechazado' ? 'Rechazado' : dto.estado === 'cancelado' ? 'Cancelado' : 'Nota'}: ${motivo}` } });
      return row;
    });
    await this.emit('status', id, user, sessionId, { before: existing, after, affects: delivering ? ['stock', 'product', 'project', 'client'] : [] });
    return this.findOne(id, user);
  }

  async addComentario(id: string, dto: AddComentarioDto, user: User, sessionId?: string) {
    this.assertCanManage(user);
    const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido interno no encontrado');

    if (!dto.contenido?.trim()) throw new BadRequestException('El comentario no puede estar vacío');

    const comentario = await this.prisma.pedidoInternoComentario.create({
      data: {
        pedidoId: id,
        autorId: user.id,
        contenido: dto.contenido.trim(),
      },
      include: { autor: { select: { id: true, name: true } } },
    });

    await this.emit('comment', id, user, sessionId);
    return comentario;
  }
}
