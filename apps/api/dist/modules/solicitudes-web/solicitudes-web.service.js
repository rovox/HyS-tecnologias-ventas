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
exports.SolicitudesWebService = void 0;
exports.clientTipoFromServicio = clientTipoFromServicio;
const common_1 = require("@nestjs/common");
const roles_1 = require("../../common/policy/roles");
const clients_1 = require("../clients");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const solicitud_web_dto_1 = require("./dto/solicitud-web.dto");
const TRANSICIONES = {
    nueva: ['contactada', 'descartada'],
    contactada: ['nueva', 'descartada'],
    descartada: ['nueva', 'contactada'],
    convertida: [],
};
function clientTipoFromServicio(servicio) {
    const s = servicio.toLowerCase();
    if (s.includes('seguridad'))
        return 'Seguridad Electrónica';
    if (s.includes('cómputo') || s.includes('computo') || s.includes('equipos'))
        return 'Equipos y tecnología';
    return 'Proyectos';
}
let SolicitudesWebService = class SolicitudesWebService {
    prisma;
    audit;
    clients;
    constructor(prisma, audit, clients) {
        this.prisma = prisma;
        this.audit = audit;
        this.clients = clients;
    }
    async createFromWebhook(dto) {
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
        await this.audit.record({
            action: 'solicitud_web.created',
            entity: 'solicitud_web',
            id: row.id,
            patch: { estado: row.estado, servicio: row.servicio },
        });
        return { id: row.id };
    }
    list(user, estado, q) {
        (0, roles_1.assertCanManageWebLeads)(user);
        if (estado && !solicitud_web_dto_1.SOLICITUD_ESTADOS.includes(estado)) {
            throw new common_1.BadRequestException('Estado no válido');
        }
        const term = (q || '').trim();
        const where = {
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
    async get(id, user) {
        (0, roles_1.assertCanManageWebLeads)(user);
        const row = await this.prisma.solicitudWeb.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Solicitud no encontrada');
        return row;
    }
    async update(id, dto, user, sessionId) {
        const current = await this.get(id, user);
        if (dto.estado && dto.estado !== current.estado && !TRANSICIONES[current.estado]?.includes(dto.estado)) {
            throw new common_1.BadRequestException(`No se puede pasar de "${current.estado}" a "${dto.estado}"`);
        }
        const row = await this.prisma.solicitudWeb.update({
            where: { id },
            data: {
                ...(dto.estado ? { estado: dto.estado } : {}),
                ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
            },
        });
        await this.audit.record({ user, sessionId, action: 'solicitud_web.update', entity: 'solicitud_web', id, patch: { estado: row.estado } });
        return row;
    }
    async convert(id, user, sessionId) {
        const current = await this.get(id, user);
        if (current.estado === 'convertida' && current.clienteId) {
            const client = await this.prisma.client.findUnique({ where: { id: current.clienteId } });
            return { solicitud: current, client, created: false };
        }
        const nombre = (current.empresa || current.nombre).trim();
        const match = [{ nombre: { equals: nombre } }];
        if (current.email)
            match.push({ email: { equals: current.email } });
        if (current.telefono)
            match.push({ telefono: { equals: current.telefono } });
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
            client = await this.clients.create({
                nombre,
                tipo: clientTipoFromServicio(current.servicio),
                contacto: current.empresa ? current.nombre : '',
                email: current.email,
                telefono: current.telefono,
                observaciones,
            }, user, sessionId);
        }
        const solicitud = await this.prisma.solicitudWeb.update({
            where: { id },
            data: { estado: 'convertida', clienteId: client.id, convertidaAt: new Date() },
        });
        await this.audit.record({ user, sessionId, action: 'solicitud_web.convert', entity: 'solicitud_web', id, patch: { estado: solicitud.estado, clienteId: client.id } });
        return { solicitud, client, created };
    }
};
exports.SolicitudesWebService = SolicitudesWebService;
exports.SolicitudesWebService = SolicitudesWebService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        clients_1.ClientsService])
], SolicitudesWebService);
//# sourceMappingURL=solicitudes-web.service.js.map