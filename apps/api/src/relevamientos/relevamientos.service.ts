import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { UpsertRelevamientoDto } from './dto/relevamiento.dto';
import { isCont, isTec, isVentas, relevamientoWhere } from '../auth/roles';

@Injectable()
export class RelevamientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  list(user: User, cotizacionId?: string) {
    if (isCont(user)) throw new ForbiddenException('Sin acceso a relevamientos');
    return this.prisma.relevamiento.findMany({
      where: relevamientoWhere(user, cotizacionId),
      include: { cliente: true, sucursal: true, cotizacion: true },
      orderBy: { fecha: 'desc' },
    });
  }

  async get(id: string, user: User) {
    const row = await this.prisma.relevamiento.findFirst({
      where: { id, ...relevamientoWhere(user) },
      include: { cliente: true, sucursal: true, cotizacion: true },
    });
    if (!row) throw new NotFoundException('Relevamiento no encontrado');
    return row;
  }

  async create(dto: UpsertRelevamientoDto, user: User, sessionId?: string) {
    if (isCont(user)) throw new ForbiddenException('Sin acceso a relevamientos');
    const quote = await this.prisma.quotation.findUnique({ where: { id: dto.cotizacionId } });
    if (!quote) throw new BadRequestException('La cotización es obligatoria');
    if (!quote.clienteId) throw new BadRequestException('Asigna un cliente a la cotización antes del relevamiento');
    const defaultTipo = isTec(user) && !isVentas(user) ? 'asistencia' : 'relevamiento';
    const row = await this.prisma.relevamiento.create({
      data: {
        usuarioId: user.id,
        clienteId: quote.clienteId,
        sucursalId: quote.sucursalId,
        fecha: new Date(dto.fecha),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        tipoVisita: dto.tipoVisita || defaultTipo,
        vendedorId: dto.vendedorId || (isVentas(user) ? user.id : null),
        tecnicoId: dto.tecnicoId || (isTec(user) ? user.id : null),
        lugar: dto.lugar.trim(),
        notas: dto.notas || null,
        fotosUrl: dto.fotosUrl === undefined ? undefined : (dto.fotosUrl as object),
        cotizacionId: quote.id,
      },
    });
    await this.prisma.touchClientActivity(quote.clienteId);
    await this.activity.log(user.id, sessionId, 'relevamiento.create', 'relevamiento', row.id);
    return row;
  }

  async update(id: string, dto: Partial<UpsertRelevamientoDto>, user: User, sessionId?: string) {
    await this.get(id, user);
    const row = await this.prisma.relevamiento.update({
      where: { id },
      data: {
        ...(dto.fecha ? { fecha: new Date(dto.fecha) } : {}),
        ...(dto.fechaFin !== undefined ? { fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null } : {}),
        ...(dto.tipoVisita ? { tipoVisita: dto.tipoVisita } : {}),
        ...(dto.vendedorId !== undefined ? { vendedorId: dto.vendedorId || null } : {}),
        ...(dto.tecnicoId !== undefined ? { tecnicoId: dto.tecnicoId || null } : {}),
        ...(dto.lugar ? { lugar: dto.lugar.trim() } : {}),
        ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
        ...(dto.fotosUrl !== undefined ? { fotosUrl: dto.fotosUrl as object } : {}),
      },
    });
    await this.activity.log(user.id, sessionId, 'relevamiento.update', 'relevamiento', id);
    return row;
  }
}
