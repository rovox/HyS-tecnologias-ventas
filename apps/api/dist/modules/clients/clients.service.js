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
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
let ClientsService = class ClientsService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    list(user, q) {
        const query = q?.trim();
        return this.prisma.client.findMany({
            where: {
                ...(0, roles_1.clientWhere)(user),
                ...(query
                    ? { OR: [{ nombre: { contains: query } }, { telefono: { contains: query } }, { email: { contains: query } }, { contacto: { contains: query } }] }
                    : {}),
            },
            include: { sucursal: { select: { id: true, nombre: true } } },
            orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
            take: query ? 20 : undefined,
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
                mapsLink: dto.mapsLink?.trim() || '',
                sucursalId,
                observaciones: dto.observaciones || '',
                lastActivityAt: new Date(),
            },
        });
        await this.audit.record({ user, sessionId, action: 'client.create', entity: 'client', id: client.id });
        return client;
    }
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateClients)(user);
        const before = await this.get(id, user);
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
                ...(dto.mapsLink !== undefined ? { mapsLink: dto.mapsLink.trim() } : {}),
                ...(dto.sucursalId !== undefined ? { sucursalId: dto.sucursalId } : {}),
                ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones } : {}),
            },
        });
        await this.audit.record({ user, sessionId, action: 'client.update', entity: 'client', id, before, after: client });
        return client;
    }
};
exports.ClientsService = ClientsService;
exports.ClientsService = ClientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], ClientsService);
//# sourceMappingURL=clients.service.js.map