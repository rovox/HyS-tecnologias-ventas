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
exports.RelevamientosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
let RelevamientosService = class RelevamientosService {
    prisma;
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    list(user, cotizacionId) {
        if ((0, roles_1.isCont)(user))
            throw new common_1.ForbiddenException('Sin acceso a relevamientos');
        return this.prisma.relevamiento.findMany({
            where: (0, roles_1.relevamientoWhere)(user, cotizacionId),
            include: { cliente: true, sucursal: true, cotizacion: true },
            orderBy: { fecha: 'desc' },
        });
    }
    async get(id, user) {
        const row = await this.prisma.relevamiento.findFirst({
            where: { id, ...(0, roles_1.relevamientoWhere)(user) },
            include: { cliente: true, sucursal: true, cotizacion: true },
        });
        if (!row)
            throw new common_1.NotFoundException('Relevamiento no encontrado');
        return row;
    }
    async create(dto, user, sessionId) {
        if ((0, roles_1.isCont)(user))
            throw new common_1.ForbiddenException('Sin acceso a relevamientos');
        const quote = await this.prisma.quotation.findUnique({ where: { id: dto.cotizacionId } });
        if (!quote)
            throw new common_1.BadRequestException('La cotización es obligatoria');
        if (!quote.clienteId)
            throw new common_1.BadRequestException('Asigna un cliente a la cotización antes del relevamiento');
        const defaultTipo = (0, roles_1.isTec)(user) && !(0, roles_1.isVentas)(user) ? 'asistencia' : 'relevamiento';
        const row = await this.prisma.relevamiento.create({
            data: {
                usuarioId: user.id,
                clienteId: quote.clienteId,
                sucursalId: quote.sucursalId,
                fecha: new Date(dto.fecha),
                fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null,
                tipoVisita: dto.tipoVisita || defaultTipo,
                vendedorId: dto.vendedorId || ((0, roles_1.isVentas)(user) ? user.id : null),
                tecnicoId: dto.tecnicoId || ((0, roles_1.isTec)(user) ? user.id : null),
                lugar: dto.lugar.trim(),
                notas: dto.notas || null,
                fotosUrl: dto.fotosUrl === undefined ? undefined : dto.fotosUrl,
                cotizacionId: quote.id,
            },
        });
        await this.prisma.touchClientActivity(quote.clienteId);
        await this.activity.log(user.id, sessionId, 'relevamiento.create', 'relevamiento', row.id);
        return row;
    }
    async update(id, dto, user, sessionId) {
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
                ...(dto.fotosUrl !== undefined ? { fotosUrl: dto.fotosUrl } : {}),
            },
        });
        await this.activity.log(user.id, sessionId, 'relevamiento.update', 'relevamiento', id);
        return row;
    }
};
exports.RelevamientosService = RelevamientosService;
exports.RelevamientosService = RelevamientosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], RelevamientosService);
//# sourceMappingURL=relevamientos.service.js.map