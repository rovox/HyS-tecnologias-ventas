import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { ActivityService } from '../auth/activity.service';
import { assertCanManageWebLeads } from '../auth/roles';
import { ClientsService } from '../clients/clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { SOLICITUD_ESTADOS, UpdateSolicitudDto, WebhookSolicitudDto } from './dto/solicitud-web.dto';

/** Allowed manual state changes. `convertida` is only reached through convert(). */
const TRANSICIONES: Record<string, string[]> = {
  nueva: ['contactada', 'descartada'],
  contactada: ['nueva', 'descartada'],
  descartada: ['nueva', 'contactada'],
  convertida: [],
};

/** Website "servicio de interés" → Client.tipo (the quotation main categories). */
export function clientTipoFromServicio(servicio: string): string {
  const s = servicio.toLowerCase();
  if (s.includes('seguridad')) return 'Seguridad Electrónica';
  if (s.includes('cómputo') || s.includes('computo') || s.includes('equipos')) return 'Equipos y tecnología';
  return 'Proyectos';
}

@Injectable()
export class SolicitudesWebService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly realtime: RealtimeService,
    private readonly clients: ClientsService,
  ) {}

  /** Public webhook (no user): store the request exactly as the visitor sent it. */
  async createFromWebhook(dto: WebhookSolicitudDto) {
    const row = await this.prisma.solicitudWeb.create({
      data: {
        nombre: dto.nombre.trim(),
        empresa: (dto.empresa || '').trim(),
        email: (dto.email || '').trim().toLowerCase(),
        telefono: (dto.telefono || '').trim(),
        departamento: (dto.departamento || '').trim(),
        servicio: (dto.servicio || '').trim(),
        detalle: dto.detalle.trim(),
        pagina: (dto.pagina || '').trim(),
        notas: '',
      },
    });
    this.realtime.emit('solicitud_web.created', 'solicitud_web', row.id, {
      patch: { estado: row.estado, servicio: row.servicio },
    });
    return { id: row.id };
  }

  list(user: User, estado?: string, q?: string) {
    assertCanManageWebLeads(user);
    if (estado && !(SOLICITUD_ESTADOS as readonly string[]).includes(estado)) {
      throw new BadRequestException('Estado no válido');
    }
    const term = (q || '').trim();
    const where: Prisma.SolicitudWebWhereInput = {
      ...(estado ? { estado } : {}),
      ...(term
        ? {
            OR: [
              { nombre: { contains: term } },
              { empresa: { contains: term } },
              { email: { contains: term } },
              { telefono: { contains: term } },
            ],
          }
        : {}),
    };
    return this.prisma.solicitudWeb.findMany({ where, orderBy: { createdAt: 'desc' }, take: 500 });
  }

  async get(id: string, user: User) {
    assertCanManageWebLeads(user);
    const row = await this.prisma.solicitudWeb.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Solicitud no encontrada');
    return row;
  }

  async update(id: string, dto: UpdateSolicitudDto, user: User, sessionId?: string) {
    const current = await this.get(id, user);
    if (dto.estado && dto.estado !== current.estado && !TRANSICIONES[current.estado]?.includes(dto.estado)) {
      throw new BadRequestException(`No se puede pasar de "${current.estado}" a "${dto.estado}"`);
    }
    const row = await this.prisma.solicitudWeb.update({
      where: { id },
      data: {
        ...(dto.estado ? { estado: dto.estado } : {}),
        ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
      },
    });
    await this.activity.log(user.id, sessionId, 'solicitud_web.update', 'solicitud_web', id);
    this.realtime.emit('solicitud_web.updated', 'solicitud_web', id, {
      byUserId: user.id,
      patch: { estado: row.estado },
    });
    return row;
  }

  /**
   * Turn a request into an official Client. Reuses an existing client with the
   * same email, phone or name instead of creating a duplicate.
   */
  async convert(id: string, user: User, sessionId?: string) {
    const current = await this.get(id, user);
    if (current.estado === 'convertida' && current.clienteId) {
      const client = await this.prisma.client.findUnique({ where: { id: current.clienteId } });
      return { solicitud: current, client, created: false };
    }

    const nombre = (current.empresa || current.nombre).trim();
    const match: Prisma.ClientWhereInput[] = [{ nombre: { equals: nombre } }];
    if (current.email) match.push({ email: { equals: current.email } });
    if (current.telefono) match.push({ telefono: { equals: current.telefono } });
    let client = await this.prisma.client.findFirst({ where: { OR: match } });
    const created = !client;

    if (!client) {
      const observaciones = [
        current.servicio ? `Servicio de interés: ${current.servicio}` : '',
        current.departamento ? `Departamento: ${current.departamento}` : '',
        `Requerimiento: ${current.detalle}`,
        'Origen: formulario web hstecnologias.com',
      ]
        .filter(Boolean)
        .join('\n');
      client = await this.clients.create(
        {
          nombre,
          tipo: clientTipoFromServicio(current.servicio),
          contacto: current.empresa ? current.nombre : '',
          email: current.email,
          telefono: current.telefono,
          observaciones,
        },
        user,
        sessionId,
      );
    }

    const solicitud = await this.prisma.solicitudWeb.update({
      where: { id },
      data: { estado: 'convertida', clienteId: client.id, convertidaAt: new Date() },
    });
    await this.activity.log(user.id, sessionId, 'solicitud_web.convert', 'solicitud_web', id);
    this.realtime.emit('solicitud_web.updated', 'solicitud_web', id, {
      byUserId: user.id,
      patch: { estado: solicitud.estado, clienteId: client.id },
    });
    return { solicitud, client, created };
  }
}
