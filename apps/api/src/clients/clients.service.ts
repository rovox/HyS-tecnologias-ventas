import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { UpdateClientDto, UpsertClientDto } from './dto/upsert-client.dto';
import { assertCanMutateClients, clientWhere, isAdmin } from '../auth/roles';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  async list(user: User, q?: string, active?: string) {
    const query = q?.trim();
    const activeOnly = active === '1' || active === 'true';
    const hace90 = new Date();
    hace90.setDate(hace90.getDate() - 90);

    const rows = await this.prisma.client.findMany({
      where: {
        ...clientWhere(user),
        ...(query
          ? {
              OR: [
                { nombre: { contains: query } },
                { telefono: { contains: query } },
                { email: { contains: query } },
                { contacto: { contains: query } },
              ],
            }
          : {}),
        ...(activeOnly
          ? {
              OR: [
                { lastActivityAt: { gte: hace90 } },
                { quotations: { some: { estado: { in: ['borrador', 'enviado'] } } } },
                { quotations: { some: { sale: { status: 'abierta' } } } },
              ],
            }
          : {}),
      },
      orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
      take: query ? 10 : undefined,
      include: {
        quotations: {
          select: {
            id: true,
            estado: true,
            sale: { select: { id: true, status: true } },
          },
        },
      },
    });

    const quoteIds = rows.flatMap((row) => row.quotations.map((q) => q.id));
    const saleIds = rows.flatMap((row) =>
      row.quotations.map((q) => q.sale?.id).filter(Boolean) as string[],
    );
    const tasks = quoteIds.length || saleIds.length
      ? await this.prisma.task.findMany({
          where: {
            OR: [
              ...(quoteIds.length ? [{ cotizacionId: { in: quoteIds } }] : []),
              ...(saleIds.length ? [{ scheduleId: { in: saleIds } }] : []),
            ],
          },
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            titulo: true,
            estado: true,
            plazo: true,
            updatedAt: true,
            createdAt: true,
            cotizacionId: true,
            scheduleId: true,
          },
        })
      : [];

    return rows.map((row) => {
      const openSales = row.quotations.filter((q) => q.sale?.status === 'abierta').length;
      const openQuotes = row.quotations.filter((q) => q.estado === 'borrador' || q.estado === 'enviado').length;
      const ids = new Set(row.quotations.map((q) => q.id));
      const sids = new Set(row.quotations.map((q) => q.sale?.id).filter(Boolean));
      const clientTasks = tasks.filter(
        (t) => (t.cotizacionId && ids.has(t.cotizacionId)) || (t.scheduleId && sids.has(t.scheduleId)),
      );
      const esActivo =
        (row.lastActivityAt && row.lastActivityAt >= hace90)
        || openQuotes > 0
        || openSales > 0;
      const { quotations: _q, ...client } = row;
      return {
        ...client,
        esActivo,
        cotizacionesCount: row.quotations.length,
        trabajosEnProceso: openSales,
        tareasCount: clientTasks.length,
        tareasRecientes: clientTasks.slice(0, 3).map((t) => ({
          id: t.id,
          titulo: t.titulo,
          estado: t.estado,
          at: t.plazo || t.updatedAt || t.createdAt,
        })),
      };
    });
  }

  async get(id: string, user: User) {
    const client = await this.prisma.client.findFirst({
      where: { id, ...clientWhere(user) },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async history(id: string, user: User) {
    const client = await this.get(id, user);
    const [quotations, relevamientos, sales] = await Promise.all([
      this.prisma.quotation.findMany({
        where: { clienteId: id },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, numero: true, titulo: true, estado: true, monto: true, createdAt: true },
      }),
      this.prisma.relevamiento.findMany({
        where: { clienteId: id },
        orderBy: { fecha: 'desc' },
        take: 40,
        select: { id: true, fecha: true, lugar: true, notas: true, createdAt: true },
      }),
      this.prisma.sale.findMany({
        where: { quotation: { clienteId: id } },
        orderBy: { createdAt: 'desc' },
        take: 40,
        select: { id: true, total: true, status: true, createdAt: true, quotation: { select: { numero: true, titulo: true } } },
      }),
    ]);
    const events = [
      ...quotations.map((row) => ({
        type: 'cotizacion',
        id: row.id,
        at: row.createdAt,
        titulo: `${row.numero} · ${row.titulo}`,
        detalle: row.estado,
        monto: Number(row.monto),
      })),
      ...relevamientos.map((row) => ({
        type: 'relevamiento',
        id: row.id,
        at: row.createdAt || row.fecha,
        titulo: row.lugar,
        detalle: row.notas || '',
      })),
      ...sales.map((row) => ({
        type: 'venta',
        id: row.id,
        at: row.createdAt,
        titulo: row.quotation?.numero || 'Venta',
        detalle: row.status,
        monto: Number(row.total),
      })),
    ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
    return { client, events };
  }

  async create(dto: UpsertClientDto, user: User, sessionId?: string) {
    assertCanMutateClients(user);
    const nombre = dto.nombre.trim();
    const dup = await this.prisma.client.findFirst({
      where: { nombre: { equals: nombre } },
    });
    if (dup) throw new BadRequestException('Ya existe un cliente registrado con ese nombre.');
    const sucursalId = dto.sucursalId || user.sucursalId || 'suc_central';
    if (user.sucursalId && sucursalId !== user.sucursalId && !isAdmin(user)) {
      throw new ForbiddenException('Solo puedes registrar clientes de tu sucursal');
    }
    const client = await this.prisma.client.create({
      data: {
        nombre,
        tipo: (dto.tipo || '').trim(),
        contacto: dto.contacto || '',
        email: dto.email || '',
        telefono: dto.telefono || '',
        direccion: dto.direccion || '',
        sucursalId,
        observaciones: dto.observaciones || '',
        lastActivityAt: new Date(),
      },
    });
    await this.activity.log(user.id, sessionId, 'client.create', 'client', client.id);
    return client;
  }

  async update(id: string, dto: UpdateClientDto, user: User, sessionId?: string) {
    assertCanMutateClients(user);
    await this.get(id, user);
    if (dto.nombre) {
      const dup = await this.prisma.client.findFirst({
        where: { nombre: { equals: dto.nombre.trim() }, NOT: { id } },
      });
      if (dup) throw new BadRequestException('Ya existe otro cliente registrado con ese nombre.');
    }
    const client = await this.prisma.client.update({
      where: { id },
      data: {
        ...(dto.nombre ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.tipo !== undefined ? { tipo: dto.tipo.trim() } : {}),
        ...(dto.contacto !== undefined ? { contacto: dto.contacto } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.telefono !== undefined ? { telefono: dto.telefono } : {}),
        ...(dto.direccion !== undefined ? { direccion: dto.direccion } : {}),
        ...(dto.sucursalId !== undefined ? { sucursalId: dto.sucursalId } : {}),
        ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones } : {}),
      },
    });
    await this.activity.log(user.id, sessionId, 'client.update', 'client', id);
    return client;
  }
}
