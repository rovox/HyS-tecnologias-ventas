import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { UpsertRelevamientoDto } from './dto/relevamiento.dto';
import { isTec, isVentas, relevamientoWhere } from '../auth/roles';
import { RealtimeService } from '../realtime/realtime.service';

const ESTADOS = ['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'];

function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), 'relevamientos');
}

function fotosList(fotosUrl: unknown): string[] {
  if (!fotosUrl) return [];
  if (Array.isArray(fotosUrl)) return fotosUrl.map(String).filter(Boolean);
  if (typeof fotosUrl === 'object' && fotosUrl !== null && Array.isArray((fotosUrl as { urls?: unknown }).urls)) {
    return ((fotosUrl as { urls: unknown[] }).urls || []).map(String).filter(Boolean);
  }
  return [];
}

@Injectable()
export class RelevamientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly realtime: RealtimeService,
  ) {}

  list(user: User, cotizacionId?: string) {
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
    let clienteId: string;
    let sucursalId: string | null = null;
    let cotizacionId: string | null = null;

    if (dto.cotizacionId) {
      const quote = await this.prisma.quotation.findUnique({ where: { id: dto.cotizacionId } });
      if (!quote) throw new BadRequestException('Cotización no encontrada');
      if (!quote.clienteId) throw new BadRequestException('Asigna un cliente a la cotización antes del relevamiento');
      clienteId = quote.clienteId;
      sucursalId = quote.sucursalId;
      cotizacionId = quote.id;
    } else if (dto.clienteId) {
      const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
      if (!client) throw new BadRequestException('Cliente no encontrado');
      clienteId = dto.clienteId;
      sucursalId = dto.sucursalId || null;
      cotizacionId = null;
    } else {
      throw new BadRequestException('Debes indicar una cotización o un cliente');
    }

    const defaultTipo = isTec(user) && !isVentas(user) ? 'asistencia' : 'relevamiento';
    const row = await this.prisma.relevamiento.create({
      data: {
        usuarioId: user.id,
        clienteId,
        sucursalId: sucursalId ?? undefined,
        fecha: new Date(dto.fecha),
        fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
        tipoVisita: dto.tipoVisita || defaultTipo,
        estado: dto.estado || 'programado',
        prioridad: dto.prioridad || 'media',
        vendedorId: dto.vendedorId || (isVentas(user) ? user.id : null),
        tecnicoId: dto.tecnicoId || (isTec(user) ? user.id : null),
        lugar: dto.lugar.trim(),
        notas: dto.notas || null,
        fotosUrl: dto.fotosUrl === undefined ? undefined : (dto.fotosUrl as object),
        cotizacionId: cotizacionId ?? undefined,
      },
    });
    await this.prisma.touchClientActivity(clienteId);
    await this.activity.log(user.id, sessionId, 'relevamiento.create', 'relevamiento', row.id);
    this.realtime.emit('relevamiento.created', 'relevamiento', row.id, {
      byUserId: user.id,
      patch: { estado: row.estado, prioridad: row.prioridad, fecha: row.fecha },
    });
    return row;
  }

  async update(id: string, dto: Partial<UpsertRelevamientoDto>, user: User, sessionId?: string) {
    const current = await this.get(id, user);
    if (dto.estado && !ESTADOS.includes(dto.estado)) {
      throw new BadRequestException('Estado de visita no válido');
    }
    if (dto.estado === 'resuelto') {
      const fotos = fotosList(dto.fotosUrl !== undefined ? dto.fotosUrl : current.fotosUrl);
      if (fotos.length < 1) {
        throw new BadRequestException('Debes subir al menos una foto de evidencia para marcar como resuelto');
      }
    }
    const row = await this.prisma.relevamiento.update({
      where: { id },
      data: {
        ...(dto.fecha ? { fecha: new Date(dto.fecha) } : {}),
        ...(dto.fechaFin !== undefined ? { fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null } : {}),
        ...(dto.tipoVisita ? { tipoVisita: dto.tipoVisita } : {}),
        ...(dto.estado ? { estado: dto.estado } : {}),
        ...(dto.prioridad ? { prioridad: dto.prioridad } : {}),
        ...(dto.vendedorId !== undefined ? { vendedorId: dto.vendedorId || null } : {}),
        ...(dto.tecnicoId !== undefined ? { tecnicoId: dto.tecnicoId || null } : {}),
        ...(dto.lugar ? { lugar: dto.lugar.trim() } : {}),
        ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
        ...(dto.fotosUrl !== undefined ? { fotosUrl: dto.fotosUrl as object } : {}),
      },
    });
    await this.activity.log(user.id, sessionId, 'relevamiento.update', 'relevamiento', id);
    this.realtime.emit('relevamiento.updated', 'relevamiento', id, {
      byUserId: user.id,
      patch: {
        estado: row.estado,
        prioridad: row.prioridad,
        fotosCount: fotosList(row.fotosUrl).length,
      },
    });
    return row;
  }

  async attachPhoto(
    id: string,
    file: { buffer?: Buffer; originalname?: string; mimetype?: string },
    user: User,
    sessionId?: string,
  ) {
    const current = await this.get(id, user);
    if (!file?.buffer?.length) throw new BadRequestException('Archivo de imagen requerido');
    const mime = String(file.mimetype || '');
    if (!mime.startsWith('image/')) throw new BadRequestException('Solo se permiten imágenes');
    const dir = uploadDir();
    fs.mkdirSync(dir, { recursive: true });
    const ext = path.extname(file.originalname || '') || '.jpg';
    const name = `${id}-${Date.now()}${ext}`;
    const full = path.join(dir, name);
    fs.writeFileSync(full, file.buffer);
    const url = `/api/files/relevamientos/${name}`;
    const prev = fotosList(current.fotosUrl);
    const fotosUrl = [...prev, url];
    const row = await this.prisma.relevamiento.update({
      where: { id },
      data: { fotosUrl },
    });
    await this.activity.log(user.id, sessionId, 'relevamiento.photo', 'relevamiento', id);
    this.realtime.emit('relevamiento.updated', 'relevamiento', id, {
      byUserId: user.id,
      patch: { fotosCount: fotosUrl.length },
    });
    return row;
  }

  async filePath(name: string) {
    const safe = path.basename(name);
    const full = path.join(uploadDir(), safe);
    if (!fs.existsSync(full)) throw new NotFoundException('Foto no encontrada');
    return full;
  }
}
