import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { assertCanMutateQuotes, isTec, quotationWhere } from '../../common/policy/roles';
import { CategoriesService } from '../categories';
import { TasksService } from '../tasks';
import { CreateQuotationDto, ListQuotationsQuery, UpdateQuotationDto } from './dto/quotation.dto';
import { editError, vistaFilter } from './domain/quotations.rules';
import { DETAIL, present } from './quotation.presenter';
import { QuotationFlowService } from './quotation-flow.service';

/** Quotations: lists, detail, create and edit. State changes live in QuotationFlowService. */
@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly categories: CategoriesService,
    private readonly flow: QuotationFlowService,
    private readonly tasks: TasksService,
  ) {}

  private async nextNumero() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const base = `COT-${mm}${dd}${yy}`;
    const sameDay = await this.prisma.quotation.count({
      where: { OR: [{ numero: base }, { numero: { startsWith: `${base}-` } }] },
    });
    return sameDay === 0 ? base : `${base}-${sameDay + 1}`;
  }

  private async requireSucursal(id: string) {
    const row = await this.prisma.sucursal.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Sucursal no válida');
    return row;
  }

  private assertCommission(vendors: { commissionPct?: number }[]) {
    if (vendors.length === 1) return;
    const sum = vendors.reduce((total, row) => total + Number(row.commissionPct ?? 0), 0);
    if (Math.abs(sum - 100) > 0.05) {
      throw new BadRequestException('Las comisiones de los vendedores deben sumar 100%');
    }
  }

  async list(filters: ListQuotationsQuery, user: User) {
    if (isTec(user)) throw new ForbiddenException('Sin acceso a cotizaciones');
    await this.flow.expireOverdue();
    const vista = vistaFilter(filters.vista);
    const q = filters.q?.trim();
    const rows = await this.prisma.quotation.findMany({
      where: {
        ...quotationWhere(user),
        ...(vista && filters.vista === 'abiertas' ? { estado: { in: [...vista.estados] }, eliminadaAt: null } : {}),
        ...(vista && filters.vista === 'cerradas'
          ? { OR: [{ estado: { in: [...vista.estados] } }, { eliminadaAt: { not: null } }] }
          : {}),
        ...(filters.estado ? { estado: filters.estado } : {}),
        ...(filters.categoriaId ? { categoriaId: filters.categoriaId } : {}),
        ...(filters.vendedorId ? { vendedorId: filters.vendedorId } : {}),
        ...(filters.sucursalId ? { sucursalId: filters.sucursalId } : {}),
        ...(filters.clienteId ? { clienteId: filters.clienteId } : {}),
        ...(q
          ? { AND: [{ OR: [{ numero: { contains: q } }, { titulo: { contains: q } }, { cliente: { nombre: { contains: q } } }] }] }
          : {}),
      },
      include: DETAIL,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    return rows.map(present);
  }

  /** Raw row with relations (internal use). */
  async row(id: string, user?: User) {
    const row = await this.prisma.quotation.findFirst({
      where: { id, ...(user ? quotationWhere(user) : {}) },
      include: DETAIL,
    });
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return row;
  }

  async get(id: string, user?: User) {
    return present(await this.row(id, user));
  }

  async create(dto: CreateQuotationDto, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    if (dto.clienteId) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
      if (!client) throw new BadRequestException('Cliente no encontrado');
    }
    const sucursalId = dto.sucursalId || user.sucursalId;
    if (!sucursalId) throw new BadRequestException('Sucursal no válida');
    const sucursal = await this.requireSucursal(sucursalId);
    await this.categories.assertDivision(dto.categoriaId);
    if (dto.tareaId) await this.tasks.assertConvertible(dto.tareaId, user);
    const vendors = (dto.vendedores || []).filter((row) => row.userId);
    const resolvedVendors = vendors.length
      ? vendors
      : [{ userId: user.id, nombre: user.name, commissionPct: 100 }];
    this.assertCommission(resolvedVendors);
    const numero = await this.nextNumero();
    const primary = resolvedVendors[0];
    const titulo = (dto.titulo?.trim() || (dto.observacion || '').trim().split(/\n/)[0] || 'Tarea de cotización').slice(0, 200);
    const quote = await this.prisma.quotation.create({
      data: {
        numero,
        titulo,
        categoriaId: dto.categoriaId,
        subcategoria: dto.subcategoria || '',
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        clienteId: dto.clienteId || null,
        estado: 'borrador',
        monto: dto.monto,
        observacion: dto.observacion || '',
        archivo: dto.archivo || '',
        tieneLicitacion: Boolean(dto.tieneLicitacion),
        licitacionNumero: dto.licitacionNumero || null,
        licitacionEntidad: dto.licitacionEntidad || null,
        plazoFinal: dto.plazoFinal ? new Date(dto.plazoFinal) : null,
        vendedorId: primary.userId,
        sellers: {
          create: resolvedVendors.map((row) => ({
            userId: row.userId,
            nombre: row.nombre || '',
            commissionPct: row.commissionPct ?? (resolvedVendors.length === 1 ? 100 : 0),
          })),
        },
      },
      include: DETAIL,
    });
    await this.prisma.touchClientActivity(dto.clienteId);
    await this.audit.record({ user, sessionId, action: 'quotation.create', entity: 'quotation', id: quote.id, patch: { estado: quote.estado } });
    if (dto.tareaId) await this.tasks.markConverted(dto.tareaId, quote.id, user, sessionId);
    return present(quote);
  }

  async update(id: string, dto: UpdateQuotationDto, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const current = await this.row(id, user);
    const blocked = editError(current, dto as Record<string, unknown>);
    if (blocked) throw new BadRequestException(blocked);
    if (dto.categoriaId !== undefined) await this.categories.assertDivision(dto.categoriaId);
    const vendors = dto.vendedores?.filter((row) => row.userId);
    if (vendors) {
      if (vendors.length === 0) throw new BadRequestException('Selecciona al menos un vendedor');
      this.assertCommission(vendors);
    }
    if (dto.clienteId && dto.clienteId !== current.clienteId) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
      if (!client) throw new BadRequestException('Cliente no encontrado');
    }
    const quote = await this.prisma.$transaction(async (tx) => {
      if (vendors) {
        await tx.quotationSeller.deleteMany({ where: { quotationId: id } });
        await tx.quotationSeller.createMany({
          data: vendors.map((row) => ({
            quotationId: id,
            userId: row.userId,
            nombre: row.nombre || '',
            commissionPct: row.commissionPct ?? (vendors.length === 1 ? 100 : 0),
          })),
        });
      }
      return tx.quotation.update({
        where: { id },
        data: {
          ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
          ...(dto.categoriaId !== undefined ? { categoriaId: dto.categoriaId } : {}),
          ...(dto.subcategoria !== undefined ? { subcategoria: dto.subcategoria || '' } : {}),
          ...(dto.monto !== undefined ? { monto: dto.monto } : {}),
          ...(dto.clienteId !== undefined ? { clienteId: dto.clienteId } : {}),
          ...(dto.fechaEnvio !== undefined ? { fechaEnvio: dto.fechaEnvio ? new Date(dto.fechaEnvio) : null } : {}),
          ...(dto.observacion !== undefined ? { observacion: dto.observacion } : {}),
          ...(dto.tieneLicitacion !== undefined ? { tieneLicitacion: dto.tieneLicitacion } : {}),
          ...(dto.licitacionNumero !== undefined ? { licitacionNumero: dto.licitacionNumero || null } : {}),
          ...(dto.licitacionEntidad !== undefined ? { licitacionEntidad: dto.licitacionEntidad || null } : {}),
          // Not a tender any more: its number and entity go too.
          ...(dto.tieneLicitacion === false ? { licitacionNumero: null, licitacionEntidad: null } : {}),
          ...(dto.plazoFinal !== undefined ? { plazoFinal: dto.plazoFinal ? new Date(dto.plazoFinal) : null } : {}),
          ...(vendors ? { vendedorId: vendors[0].userId } : {}),
        },
        include: DETAIL,
      });
    });
    const finalClientId = dto.clienteId || current.clienteId;
    await this.prisma.touchClientActivity(finalClientId);
    await this.audit.record({
      user,
      sessionId,
      action: 'quotation.update',
      entity: 'quotation',
      id,
      before: current,
      after: quote,
      patch: { estado: quote.estado },
    });
    return present(quote);
  }
}
