"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
let ClientsService = class ClientsService {
    prisma;
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    async list(user, q, active) {
        const query = q?.trim();
        const activeOnly = active === '1' || active === 'true';
        const hace90 = new Date();
        hace90.setDate(hace90.getDate() - 90);
        const rows = await this.prisma.client.findMany({
            where: {
                ...(0, roles_1.clientWhere)(user),
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
                schedules: {
                    select: { id: true, estado: true },
                },
            },
        });
        const quoteIds = rows.flatMap((row) => row.quotations.map((q) => q.id));
        const scheduleIds = rows.flatMap((row) => row.schedules.map((s) => s.id));
        const saleIds = rows.flatMap((row) => row.quotations.map((q) => q.sale?.id).filter(Boolean));
        const tasks = quoteIds.length || saleIds.length || scheduleIds.length
            ? await this.prisma.task.findMany({
                where: {
                    OR: [
                        ...(quoteIds.length ? [{ cotizacionId: { in: quoteIds } }] : []),
                        ...(saleIds.length ? [{ scheduleId: { in: saleIds } }] : []),
                        ...(scheduleIds.length ? [{ scheduleId: { in: scheduleIds } }] : []),
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
            const sids = new Set([
                ...row.quotations.map((q) => q.sale?.id).filter(Boolean),
                ...row.schedules.map((s) => s.id),
            ]);
            const clientTasks = tasks.filter((t) => (t.cotizacionId && ids.has(t.cotizacionId)) || (t.scheduleId && sids.has(t.scheduleId)));
            const esActivo = (row.lastActivityAt && row.lastActivityAt >= hace90)
                || openQuotes > 0
                || openSales > 0
                || row.schedules.some((s) => s.estado !== 'terminado' && s.estado !== 'cancelado');
            const esClienteContratado = row.quotations.some((q) => q.estado === 'aceptado')
                || row.schedules.some((s) => s.estado !== 'cancelado');
            const { quotations: _q, schedules: _s, ...client } = row;
            return {
                ...client,
                esActivo,
                esClienteContratado,
                cotizacionesCount: row.quotations.length,
                trabajosEnProceso: row.schedules.filter((s) => s.estado !== 'terminado' && s.estado !== 'cancelado').length,
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
    async get(id, user) {
        const client = await this.prisma.client.findFirst({
            where: { id, ...(0, roles_1.clientWhere)(user) },
        });
        if (!client)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return client;
    }
    async history(id, user) {
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
    async create(dto, user, sessionId) {
        (0, roles_1.assertCanMutateClients)(user);
        const nombre = dto.nombre.trim();
        const dup = await this.prisma.client.findFirst({
            where: { nombre: { equals: nombre } },
        });
        if (dup)
            throw new common_1.BadRequestException('Ya existe un cliente registrado con ese nombre.');
        const sucursalId = dto.sucursalId || user.sucursalId || 'suc_central';
        if (user.sucursalId && sucursalId !== user.sucursalId && !(0, roles_1.isAdmin)(user)) {
            throw new common_1.ForbiddenException('Solo puedes registrar clientes de tu sucursal');
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
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateClients)(user);
        await this.get(id, user);
        if (dto.nombre) {
            const dup = await this.prisma.client.findFirst({
                where: { nombre: { equals: dto.nombre.trim() }, NOT: { id } },
            });
            if (dup)
                throw new common_1.BadRequestException('Ya existe otro cliente registrado con ese nombre.');
        }
        if (dto.sucursalId !== undefined && !(0, roles_1.isAdmin)(user)) {
            if (user.sucursalId && dto.sucursalId !== user.sucursalId) {
                throw new common_1.ForbiddenException('Solo puedes asignar clientes de tu sucursal');
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
                ...(dto.sucursalId !== undefined ? { sucursalId: dto.sucursalId } : {}),
                ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones } : {}),
            },
        });
        await this.activity.log(user.id, sessionId, 'client.update', 'client', id);
        return client;
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map