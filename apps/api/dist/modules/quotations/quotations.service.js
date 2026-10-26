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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
const categories_1 = require("../categories");
const tasks_1 = require("../tasks");
const quotations_rules_1 = require("./domain/quotations.rules");
const quotation_presenter_1 = require("./quotation.presenter");
const quotation_flow_service_1 = require("./quotation-flow.service");
let QuotationsService = class QuotationsService {
    prisma;
    audit;
    categories;
    flow;
    tasks;
    constructor(prisma, audit, categories, flow, tasks) {
        this.prisma = prisma;
        this.audit = audit;
        this.categories = categories;
        this.flow = flow;
        this.tasks = tasks;
    }
    async nextNumero() {
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
    async requireSucursal(id) {
        const row = await this.prisma.sucursal.findUnique({ where: { id } });
        if (!row)
            throw new common_1.BadRequestException('Sucursal no válida');
        return row;
    }
    assertCommission(vendors) {
        if (vendors.length === 1)
            return;
        const sum = vendors.reduce((total, row) => total + Number(row.commissionPct ?? 0), 0);
        if (Math.abs(sum - 100) > 0.05) {
            throw new common_1.BadRequestException('Las comisiones de los vendedores deben sumar 100%');
        }
    }
    async list(filters, user) {
        if ((0, roles_1.isTec)(user))
            throw new common_1.ForbiddenException('Sin acceso a cotizaciones');
        await this.flow.expireOverdue();
        const vista = (0, quotations_rules_1.vistaFilter)(filters.vista);
        const q = filters.q?.trim();
        const rows = await this.prisma.quotation.findMany({
            where: {
                ...(0, roles_1.quotationWhere)(user),
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
            include: quotation_presenter_1.DETAIL,
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        return rows.map(quotation_presenter_1.present);
    }
    async row(id, user) {
        const row = await this.prisma.quotation.findFirst({
            where: { id, ...(user ? (0, roles_1.quotationWhere)(user) : {}) },
            include: quotation_presenter_1.DETAIL,
        });
        if (!row)
            throw new common_1.NotFoundException('Cotización no encontrada');
        return row;
    }
    async get(id, user) {
        return (0, quotation_presenter_1.present)(await this.row(id, user));
    }
    async create(dto, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        if (dto.clienteId) {
            const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
            if (!client)
                throw new common_1.BadRequestException('Cliente no encontrado');
        }
        const sucursalId = dto.sucursalId || user.sucursalId;
        if (!sucursalId)
            throw new common_1.BadRequestException('Sucursal no válida');
        const sucursal = await this.requireSucursal(sucursalId);
        await this.categories.assertDivision(dto.categoriaId);
        if (dto.tareaId)
            await this.tasks.assertConvertible(dto.tareaId, user);
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
            include: quotation_presenter_1.DETAIL,
        });
        await this.prisma.touchClientActivity(dto.clienteId);
        await this.audit.record({ user, sessionId, action: 'quotation.create', entity: 'quotation', id: quote.id, patch: { estado: quote.estado } });
        if (dto.tareaId)
            await this.tasks.markConverted(dto.tareaId, quote.id, user, sessionId);
        return (0, quotation_presenter_1.present)(quote);
    }
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.row(id, user);
        const blocked = (0, quotations_rules_1.editError)(current, dto);
        if (blocked)
            throw new common_1.BadRequestException(blocked);
        if (dto.categoriaId !== undefined)
            await this.categories.assertDivision(dto.categoriaId);
        const vendors = dto.vendedores?.filter((row) => row.userId);
        if (vendors) {
            if (vendors.length === 0)
                throw new common_1.BadRequestException('Selecciona al menos un vendedor');
            this.assertCommission(vendors);
        }
        if (dto.clienteId && dto.clienteId !== current.clienteId) {
            const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
            if (!client)
                throw new common_1.BadRequestException('Cliente no encontrado');
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
                    ...(dto.plazoFinal !== undefined ? { plazoFinal: dto.plazoFinal ? new Date(dto.plazoFinal) : null } : {}),
                    ...(vendors ? { vendedorId: vendors[0].userId } : {}),
                },
                include: quotation_presenter_1.DETAIL,
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
        return (0, quotation_presenter_1.present)(quote);
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        categories_1.CategoriesService,
        quotation_flow_service_1.QuotationFlowService,
        tasks_1.TasksService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map