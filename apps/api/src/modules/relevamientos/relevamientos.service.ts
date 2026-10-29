import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { assertCanMutateRelevamientos, isCommercial, isTec, isVentas, relevamientoWhere } from '../../common/policy/roles';
import { IncomeService } from '../finance';
import { CreateRelevamientoDto, UpdateRelevamientoDto, VisitPaymentDto, VisitStatusDto } from './dto/relevamiento.dto';
import { checkVisitTransition, isClosed, warrantyUntil } from './domain/relevamientos.rules';
import { VISIT_INCLUDE, fotosOf, presentVisits } from './relevamiento.presenter';

function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), 'relevamientos');
}

/** Text fields of the form, copied as they come ('' clears them). */
const TEXT_FIELDS = [
  'hora', 'mapsLink', 'motivo', 'problemaReportado', 'equipoAfectado', 'causaProbable', 'diagnostico', 'solucion',
  'necesidadCliente', 'areaRevisar', 'medidasPuntos', 'observacionTecnica', 'observacionFinal', 'notas',
] as const;
const FLAGS = ['requiereMaterial', 'requiereVolver', 'requiereCotizacion'] as const;
/** What a técnico may not change on a visit: who it belongs to and who goes. */
const COMMERCIAL_ONLY = ['vendedorId', 'tecnicoId', 'sucursalId'] as const;

const day = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);

@Injectable()
export class RelevamientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly income: IncomeService,
  ) {}

  async list(user: User, query: { cotizacionId?: string; clienteId?: string } = {}) {
    const rows = await this.prisma.relevamiento.findMany({
      where: { ...relevamientoWhere(user, query.cotizacionId), ...(query.clienteId ? { clienteId: query.clienteId } : {}) },
      include: VISIT_INCLUDE,
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    return presentVisits(this.prisma, rows);
  }

  async get(id: string, user: User) {
    const row = await this.prisma.relevamiento.findFirst({ where: { id, ...relevamientoWhere(user) }, include: VISIT_INCLUDE });
    if (!row) throw new NotFoundException('Visita no encontrada');
    return (await presentVisits(this.prisma, [row]))[0];
  }

  /** The related job must be the same client's; its warranty is taken unless one is given. */
  private async relatedJob(trabajoId: string, clienteId: string) {
    const job = await this.prisma.schedule.findUnique({
      where: { id: trabajoId },
      select: { clienteId: true, estado: true, fechaProgramada: true, fechaFinalizacion: true, project: { select: { estado: true, entregadoAt: true, garantiaMeses: true } } },
    });
    if (!job) throw new BadRequestException('Trabajo relacionado no encontrado');
    if (job.clienteId !== clienteId) throw new BadRequestException('El trabajo relacionado es de otro cliente');
    return warrantyUntil(job);
  }

  /** The form fields of create and update, as Prisma data ('' clears; dates as days). */
  private fields(dto: UpdateRelevamientoDto): Prisma.RelevamientoUncheckedUpdateInput {
    const data: Prisma.RelevamientoUncheckedUpdateInput = {};
    for (const key of TEXT_FIELDS) {
      const value = dto[key];
      if (value === undefined) continue;
      const nullable = !['mapsLink', 'motivo', 'equipoAfectado', 'areaRevisar'].includes(key);
      (data as Record<string, unknown>)[key] = value.trim() === '' && nullable ? null : value.trim();
    }
    for (const key of FLAGS) if (dto[key] !== undefined) data[key] = dto[key];
    if (dto.fecha) data.fecha = day(dto.fecha);
    if (dto.fechaFin !== undefined) data.fechaFin = dto.fechaFin ? day(dto.fechaFin) : null;
    if (dto.tipoVisita) data.tipoVisita = dto.tipoVisita;
    if (dto.prioridad) data.prioridad = dto.prioridad;
    if (dto.lugar !== undefined) data.lugar = dto.lugar.trim();
    if (dto.cantidadEstimada !== undefined) data.cantidadEstimada = dto.cantidadEstimada;
    if (dto.vendedorId !== undefined) data.vendedorId = dto.vendedorId || null;
    if (dto.tecnicoId !== undefined) data.tecnicoId = dto.tecnicoId || null;
    if (dto.sucursalId !== undefined) data.sucursalId = dto.sucursalId || null;
    if (dto.garantiaHasta !== undefined) data.garantiaHasta = dto.garantiaHasta ? day(dto.garantiaHasta) : null;
    return data;
  }

  async create(dto: CreateRelevamientoDto, user: User, sessionId?: string) {
    assertCanMutateRelevamientos(user);
    let clienteId: string;
    let sucursalId: string | null = dto.sucursalId || null;
    let cotizacionId: string | null = null;
    if (dto.cotizacionId) {
      const quote = await this.prisma.quotation.findUnique({ where: { id: dto.cotizacionId } });
      if (!quote) throw new BadRequestException('Cotización no encontrada');
      if (!quote.clienteId) throw new BadRequestException('Asigna un cliente a la cotización antes del relevamiento');
      clienteId = quote.clienteId;
      sucursalId = quote.sucursalId;
      cotizacionId = quote.id;
    } else if (dto.clienteId) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId }, select: { sucursalId: true } });
      if (!client) throw new BadRequestException('Cliente no encontrado');
      clienteId = dto.clienteId;
      sucursalId = sucursalId || client.sucursalId;
    } else {
      throw new BadRequestException('Indica el cliente o la cotización');
    }
    if (!dto.lugar?.trim()) throw new BadRequestException('Indica el lugar de la visita');
    const garantia = dto.trabajoRelacionadoId ? await this.relatedJob(dto.trabajoRelacionadoId, clienteId) : null;

    const tecnico = isTec(user) && !isVentas(user);
    const row = await this.prisma.relevamiento.create({
      data: {
        ...(this.fields(dto) as Prisma.RelevamientoUncheckedCreateInput),
        usuarioId: user.id,
        clienteId,
        sucursalId,
        cotizacionId,
        fecha: day(dto.fecha),
        lugar: dto.lugar.trim(),
        tipoVisita: dto.tipoVisita || (tecnico ? 'asistencia' : 'relevamiento'),
        estado: 'programado',
        vendedorId: dto.vendedorId || (isVentas(user) ? user.id : null),
        tecnicoId: tecnico ? user.id : dto.tecnicoId || null,
        trabajoRelacionadoId: dto.trabajoRelacionadoId || null,
        garantiaHasta: dto.garantiaHasta ? day(dto.garantiaHasta) : garantia,
      },
      include: VISIT_INCLUDE,
    });
    await this.prisma.touchClientActivity(clienteId);
    const [visit] = await presentVisits(this.prisma, [row]);
    await this.audit.record({ user, sessionId, action: 'relevamiento.create', entity: 'relevamiento', id: row.id, after: row, affects: ['client'] });
    return visit;
  }

  async update(id: string, dto: UpdateRelevamientoDto, user: User, sessionId?: string) {
    assertCanMutateRelevamientos(user);
    const current = await this.prisma.relevamiento.findFirst({ where: { id, ...relevamientoWhere(user) } });
    if (!current) throw new NotFoundException('Visita no encontrada');
    if (!isCommercial(user)) {
      if (isClosed(current.estado)) throw new ForbiddenException('La visita está cerrada: pide a ventas que la corrija');
      if (COMMERCIAL_ONLY.some((k) => dto[k] !== undefined && (dto[k] || null) !== current[k])) {
        throw new ForbiddenException('El técnico no cambia la sucursal ni quién atiende la visita');
      }
    }
    const data = this.fields(dto);
    if (dto.trabajoRelacionadoId !== undefined && dto.trabajoRelacionadoId !== (current.trabajoRelacionadoId ?? '')) {
      data.trabajoRelacionadoId = dto.trabajoRelacionadoId || null;
      const garantia = dto.trabajoRelacionadoId ? await this.relatedJob(dto.trabajoRelacionadoId, current.clienteId) : null;
      // A new job with the date left empty: the warranty is that job's again (the form empties it on change).
      if (!dto.garantiaHasta) data.garantiaHasta = garantia;
    }
    const row = await this.prisma.relevamiento.update({ where: { id }, data, include: VISIT_INCLUDE });
    await this.audit.record({ user, sessionId, action: 'relevamiento.update', entity: 'relevamiento', id, before: current, after: row, affects: ['client'] });
    return (await presentVisits(this.prisma, [row]))[0];
  }

  /** Resolving needs a photo; cancelling a reason. Resolving closes the visit on that day if it had no end date. */
  async changeStatus(id: string, dto: VisitStatusDto, user: User, sessionId?: string) {
    assertCanMutateRelevamientos(user);
    const current = await this.prisma.relevamiento.findFirst({ where: { id, ...relevamientoWhere(user) } });
    if (!current) throw new NotFoundException('Visita no encontrada');
    const check = checkVisitTransition(current.estado, dto.estado, { fotos: fotosOf(current.fotosUrl).length, motivo: dto.motivo });
    if (!check.ok) throw new BadRequestException(check.reason);
    const row = await this.prisma.relevamiento.update({
      where: { id },
      data: {
        estado: dto.estado,
        ...(dto.estado === 'cancelado' ? { motivoCancelacion: dto.motivo!.trim() } : {}),
        ...(dto.estado === 'resuelto' && !current.fechaFin ? { fechaFin: day(new Date().toISOString()) } : {}),
      },
      include: VISIT_INCLUDE,
    });
    await this.audit.record({ user, sessionId, action: 'relevamiento.status', entity: 'relevamiento', id, before: current, after: row, affects: ['client'] });
    return (await presentVisits(this.prisma, [row]))[0];
  }

  /** A payment taken on the visit (asistencia): to the ledger, por validar, held by whoever received it. */
  async registerPayment(id: string, dto: VisitPaymentDto, user: User, sessionId?: string) {
    await this.get(id, user);
    await this.income.register({ relevamientoId: id }, { concepto: 'asistencia', ...dto }, user, sessionId);
    return this.get(id, user);
  }

  async attachPhoto(id: string, file: { buffer?: Buffer; originalname?: string; mimetype?: string }, user: User, sessionId?: string) {
    assertCanMutateRelevamientos(user);
    const current = await this.prisma.relevamiento.findFirst({ where: { id, ...relevamientoWhere(user) } });
    if (!current) throw new NotFoundException('Visita no encontrada');
    if (!file?.buffer?.length) throw new BadRequestException('Archivo de imagen requerido');
    if (!String(file.mimetype || '').startsWith('image/')) throw new BadRequestException('Solo se permiten imágenes');
    const dir = uploadDir();
    fs.mkdirSync(dir, { recursive: true });
    const name = `${id}-${Date.now()}${path.extname(file.originalname || '') || '.jpg'}`;
    fs.writeFileSync(path.join(dir, name), file.buffer);
    const fotosUrl = [...fotosOf(current.fotosUrl), `/api/files/relevamientos/${name}`];
    const row = await this.prisma.relevamiento.update({ where: { id }, data: { fotosUrl }, include: VISIT_INCLUDE });
    await this.audit.record({ user, sessionId, action: 'relevamiento.photo', entity: 'relevamiento', id, patch: { fotos: fotosUrl.length } });
    return (await presentVisits(this.prisma, [row]))[0];
  }

  /** A photo is served only to someone who can see a visit that references it. */
  async filePath(name: string, user: User) {
    const safe = path.basename(name);
    const visible = await this.prisma.relevamiento.findMany({ where: relevamientoWhere(user), select: { fotosUrl: true } });
    if (!visible.some((row) => fotosOf(row.fotosUrl).some((url) => path.basename(url) === safe))) {
      throw new ForbiddenException('Sin acceso a esta foto');
    }
    const full = path.join(uploadDir(), safe);
    if (!fs.existsSync(full)) throw new NotFoundException('Foto no encontrada');
    return full;
  }
}
