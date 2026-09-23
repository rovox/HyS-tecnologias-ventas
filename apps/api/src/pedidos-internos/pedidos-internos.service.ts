import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddComentarioDto, UpdateEstadoPedidoDto, UpsertPedidoInternoDto } from './dto/pedido-interno.dto';

@Injectable()
export class PedidosInternosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: User, query: Record<string, string>) {
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

    const pedidos = await this.prisma.pedidoInterno.findMany({
      where,
      include: {
        responsable: { select: { id: true, name: true } },
        sucursalOrigen: { select: { id: true, nombre: true } },
        items: true,
        _count: { select: { comentarios: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return pedidos;
  }

  async findOne(id: string) {
    const pedido = await this.prisma.pedidoInterno.findUnique({
      where: { id },
      include: {
        responsable: { select: { id: true, name: true } },
        sucursalOrigen: { select: { id: true, nombre: true } },
        items: true,
        comentarios: {
          orderBy: { createdAt: 'asc' },
          include: { autor: { select: { id: true, name: true } } },
        },
      },
    });

    if (!pedido) throw new NotFoundException('Pedido interno no encontrado');

    const { comentarios, items, ...rest } = pedido;
    return {
      pedido: rest,
      detalles: items,
      comentarios,
      historial: [],
    };
  }

  async create(dto: UpsertPedidoInternoDto, user: User) {
    const { items, ...pedidoData } = dto;

    const pedido = await this.prisma.pedidoInterno.create({
      data: {
        responsableId: pedidoData.responsableId || user.id,
        sucursalOrigenId: pedidoData.sucursalOrigenId,
        sucursalDestinoId: pedidoData.sucursalDestinoId,
        cronogramaId: pedidoData.cronogramaId,
        prioridad: pedidoData.prioridad || 'Normal',
        estado: pedidoData.estado || 'solicitado',
        fechaEntregaEstimada: pedidoData.fechaEntregaEstimada
          ? new Date(pedidoData.fechaEntregaEstimada)
          : null,
        observaciones: pedidoData.observaciones,
        items: items?.length
          ? {
              create: items.map((item) => ({
                materialNombre: item.materialNombre,
                cantidad: item.cantidad,
                unidad: item.unidad || 'unidades',
                costoUnitario: item.costoUnitario,
                observaciones: item.observaciones,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
        responsable: { select: { id: true, name: true } },
        sucursalOrigen: { select: { id: true, nombre: true } },
      },
    });

    return pedido;
  }

  async update(id: string, dto: UpsertPedidoInternoDto) {
    const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido interno no encontrado');

    const { items, ...pedidoData } = dto;

    await this.prisma.$transaction(async (tx) => {
      if (items !== undefined) {
        await tx.pedidoInternoItem.deleteMany({ where: { pedidoId: id } });
      }

      await tx.pedidoInterno.update({
        where: { id },
        data: {
          ...(pedidoData.responsableId && { responsableId: pedidoData.responsableId }),
          ...(pedidoData.sucursalOrigenId !== undefined && { sucursalOrigenId: pedidoData.sucursalOrigenId }),
          ...(pedidoData.sucursalDestinoId !== undefined && { sucursalDestinoId: pedidoData.sucursalDestinoId }),
          ...(pedidoData.cronogramaId !== undefined && { cronogramaId: pedidoData.cronogramaId }),
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
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido interno no encontrado');

    await this.prisma.pedidoInterno.delete({ where: { id } });
    return { ok: true };
  }

  async updateEstado(id: string, dto: UpdateEstadoPedidoDto, user: User) {
    const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pedido interno no encontrado');

    const data: Record<string, unknown> = { estado: dto.estado };
    if (dto.estado === 'entregado') {
      data.fechaEntregaReal = dto.fecha_entrega ? new Date(dto.fecha_entrega) : new Date();
      data.entregadoPorId = dto.entregado_por_id || user.id;
    }
    if (dto.observacion) {
      data.observaciones = dto.observacion;
    }

    await this.prisma.pedidoInterno.update({ where: { id }, data });
    return this.findOne(id);
  }

  async addComentario(id: string, dto: AddComentarioDto, user: User) {
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

    return comentario;
  }
}
