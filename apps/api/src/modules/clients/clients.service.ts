import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { UpdateClientDto, UpsertClientDto } from './dto/upsert-client.dto';
import { assertCanMutateClients, clientWhere, isAdmin } from '../../common/policy/roles';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Clients for lists and pickers; balances and services in course come from the read model (GET /reporting/clients). */
  list(user: User, q?: string) {
    const query = q?.trim();
    return this.prisma.client.findMany({
      where: {
        ...clientWhere(user),
        ...(query
          ? { OR: [{ nombre: { contains: query } }, { telefono: { contains: query } }, { email: { contains: query } }, { contacto: { contains: query } }] }
          : {}),
      },
      include: { sucursal: { select: { id: true, nombre: true } } },
      orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
      take: query ? 20 : undefined,
    });
  }

  async get(id: string, user: User) {
    const client = await this.prisma.client.findFirst({
      where: { id, ...clientWhere(user) },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
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
        mapsLink: dto.mapsLink?.trim() || '',
        sucursalId,
        observaciones: dto.observaciones || '',
        lastActivityAt: new Date(),
      },
    });
    await this.audit.record({ user, sessionId, action: 'client.create', entity: 'client', id: client.id });
    return client;
  }

  async update(id: string, dto: UpdateClientDto, user: User, sessionId?: string) {
    assertCanMutateClients(user);
    const before = await this.get(id, user);
    if (dto.nombre) {
      const dup = await this.prisma.client.findFirst({
        where: { nombre: { equals: dto.nombre.trim() }, NOT: { id } },
      });
      if (dup) throw new BadRequestException('Ya existe otro cliente registrado con ese nombre.');
    }
    if (dto.sucursalId !== undefined && !isAdmin(user)) {
      if (user.sucursalId && dto.sucursalId !== user.sucursalId) {
        throw new ForbiddenException('Solo puedes asignar clientes de tu sucursal');
      }
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
        ...(dto.mapsLink !== undefined ? { mapsLink: dto.mapsLink.trim() } : {}),
        ...(dto.sucursalId !== undefined ? { sucursalId: dto.sucursalId } : {}),
        ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones } : {}),
      },
    });
    await this.audit.record({ user, sessionId, action: 'client.update', entity: 'client', id, before, after: client });
    return client;
  }
}
