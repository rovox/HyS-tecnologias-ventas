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
exports.PedidosInternosService = void 0;
const common_1 = require("@nestjs/common");
const pedidos_internos_rules_1 = require("./domain/pedidos-internos.rules");
const pedido_presenter_1 = require("./pedido.presenter");
const inventory_1 = require("../inventory");
const policy_1 = require("../../common/policy/policy");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
let PedidosInternosService = class PedidosInternosService {
    prisma;
    audit;
    inventory;
    constructor(prisma, audit, inventory) {
        this.prisma = prisma;
        this.audit = audit;
        this.inventory = inventory;
    }
    assertCanManage(user) {
        if (!(0, policy_1.canManagePedidos)(user))
            throw new common_1.ForbiddenException('Sin acceso a pedidos internos');
    }
    assertCanSee(user) {
        if (!(0, policy_1.canSeePedidos)(user))
            throw new common_1.ForbiddenException('Sin acceso a pedidos internos');
    }
    emit(type, id, user, sessionId, extra = {}) {
        return this.audit.record({
            user,
            sessionId,
            action: `pedido_interno.${type}`,
            entity: 'pedido_interno',
            id,
            before: extra.before,
            after: extra.after,
            affects: extra.affects ?? [],
        });
    }
    async deliver(tx, id, user) {
        const pedido = await tx.pedidoInterno.findUniqueOrThrow({ where: { id } });
        return this.inventory.deliverOrder(tx, pedido, user.id);
    }
    assertTransition(from, to) {
        const check = (0, pedidos_internos_rules_1.checkTransition)(from, to);
        if (!check.ok)
            throw new common_1.BadRequestException(check.reason);
    }
    async findAll(user, query) {
        this.assertCanSee(user);
        const { estado, search, prioridad, sucursal } = query;
        const where = {};
        if (estado)
            where.estado = estado;
        if (prioridad)
            where.prioridad = prioridad;
        if (sucursal)
            where.sucursalOrigenId = sucursal;
        if (search) {
            where.OR = [
                { observaciones: { contains: search } },
                { items: { some: { materialNombre: { contains: search } } } },
            ];
        }
        const rows = await this.prisma.pedidoInterno.findMany({ where, include: pedido_presenter_1.PEDIDO_INCLUDE, orderBy: { createdAt: 'desc' } });
        return (0, pedido_presenter_1.presentPedidos)(this.prisma, rows);
    }
    async findOne(id, user) {
        this.assertCanSee(user);
        const row = await this.prisma.pedidoInterno.findUnique({ where: { id }, include: pedido_presenter_1.PEDIDO_INCLUDE });
        if (!row)
            throw new common_1.NotFoundException('Pedido interno no encontrado');
        const [[pedido], comentarios, movimientos] = await Promise.all([
            (0, pedido_presenter_1.presentPedidos)(this.prisma, [row]),
            this.prisma.pedidoInternoComentario.findMany({
                where: { pedidoId: id },
                orderBy: { createdAt: 'asc' },
                include: { autor: { select: { id: true, name: true } } },
            }),
            this.prisma.stockMovement.findMany({
                where: { pedidoInternoId: id },
                orderBy: { fecha: 'asc' },
                include: { producto: { select: { id: true, codigo: true, nombre: true, unidad: true } } },
            }),
        ]);
        return { ...pedido, comentarios, movimientos };
    }
    async create(dto, user, sessionId) {
        this.assertCanManage(user);
        const { items, ...pedidoData } = dto;
        await this.inventory.assertProducts((items || []).map((i) => i.productoId || ''));
        const pedido = await this.prisma.pedidoInterno.create({
            data: {
                responsableId: pedidoData.responsableId || user.id,
                solicitanteId: user.id,
                sucursalOrigenId: pedidoData.sucursalOrigenId,
                sucursalDestinoId: pedidoData.sucursalDestinoId,
                cronogramaId: pedidoData.cronogramaId,
                prioridad: pedidoData.prioridad || 'Normal',
                estado: pedidoData.estado || 'solicitado',
                fechaEntregaEstimada: pedidoData.fechaEntregaEstimada
                    ? new Date(pedidoData.fechaEntregaEstimada)
                    : null,
                observaciones: pedidoData.observaciones,
                items: items?.length
                    ? {
                        create: items.map((item) => ({
                            productoId: item.productoId || null,
                            materialNombre: item.materialNombre,
                            cantidad: item.cantidad,
                            unidad: item.unidad || 'unidades',
                            costoUnitario: item.costoUnitario,
                            observaciones: item.observaciones,
                        })),
                    }
                    : undefined,
            },
            include: pedido_presenter_1.PEDIDO_INCLUDE,
        });
        await this.emit('created', pedido.id, user, sessionId);
        return (await (0, pedido_presenter_1.presentPedidos)(this.prisma, [pedido]))[0];
    }
    async update(id, dto, user, sessionId) {
        this.assertCanManage(user);
        const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Pedido interno no encontrado');
        if (dto.estado && dto.estado !== existing.estado)
            this.assertTransition(existing.estado, dto.estado);
        const { items, ...pedidoData } = dto;
        if (items)
            await this.inventory.assertProducts(items.map((i) => i.productoId || ''));
        const delivering = dto.estado === 'entregado' && existing.estado !== 'entregado';
        await this.prisma.$transaction(async (tx) => {
            if (items !== undefined) {
                await tx.pedidoInternoItem.deleteMany({ where: { pedidoId: id } });
            }
            await tx.pedidoInterno.update({
                where: { id },
                data: {
                    ...(pedidoData.responsableId && { responsableId: pedidoData.responsableId }),
                    ...(pedidoData.sucursalOrigenId !== undefined && { sucursalOrigenId: pedidoData.sucursalOrigenId }),
                    ...(pedidoData.sucursalDestinoId !== undefined && { sucursalDestinoId: pedidoData.sucursalDestinoId }),
                    ...(pedidoData.cronogramaId !== undefined && { cronogramaId: pedidoData.cronogramaId }),
                    ...(pedidoData.prioridad && { prioridad: pedidoData.prioridad }),
                    ...(pedidoData.estado && { estado: pedidoData.estado }),
                    ...(pedidoData.fechaEntregaEstimada !== undefined && {
                        fechaEntregaEstimada: pedidoData.fechaEntregaEstimada
                            ? new Date(pedidoData.fechaEntregaEstimada)
                            : null,
                    }),
                    ...(pedidoData.observaciones !== undefined && { observaciones: pedidoData.observaciones }),
                    ...(items !== undefined && {
                        items: {
                            create: items.map((item) => ({
                                productoId: item.productoId || null,
                                materialNombre: item.materialNombre,
                                cantidad: item.cantidad,
                                unidad: item.unidad || 'unidades',
                                costoUnitario: item.costoUnitario,
                                observaciones: item.observaciones,
                            })),
                        },
                    }),
                },
            });
            if (delivering)
                await this.deliver(tx, id, user);
        });
        const after = await this.prisma.pedidoInterno.findUnique({ where: { id } });
        await this.emit('update', id, user, sessionId, { before: existing, after, affects: delivering ? ['stock', 'product', 'project', 'client'] : [] });
        return this.findOne(id, user);
    }
    async remove(id, user, sessionId) {
        this.assertCanManage(user);
        const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Pedido interno no encontrado');
        const blocked = (0, pedidos_internos_rules_1.deleteError)(existing.estado);
        if (blocked)
            throw new common_1.BadRequestException(blocked);
        await this.prisma.pedidoInterno.delete({ where: { id } });
        await this.emit('delete', id, user, sessionId);
        return { ok: true };
    }
    async updateEstado(id, dto, user, sessionId) {
        this.assertCanManage(user);
        const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Pedido interno no encontrado');
        this.assertTransition(existing.estado, dto.estado);
        const motivo = dto.observacion?.trim();
        if ((0, pedidos_internos_rules_1.transitionNeedsReason)(dto.estado) && !motivo)
            throw new common_1.BadRequestException('Indica el motivo');
        const data = {
            estado: dto.estado,
            ...(0, pedidos_internos_rules_1.deliveryFields)(dto.estado, { fechaEntrega: dto.fecha_entrega, entregadoPorId: dto.entregado_por_id }, user.id, new Date()),
        };
        const delivering = dto.estado === 'entregado';
        const after = await this.prisma.$transaction(async (tx) => {
            const row = await tx.pedidoInterno.update({ where: { id }, data });
            if (delivering)
                await this.deliver(tx, id, user);
            if (motivo)
                await tx.pedidoInternoComentario.create({ data: { pedidoId: id, autorId: user.id, contenido: `${dto.estado === 'rechazado' ? 'Rechazado' : dto.estado === 'cancelado' ? 'Cancelado' : 'Nota'}: ${motivo}` } });
            return row;
        });
        await this.emit('status', id, user, sessionId, { before: existing, after, affects: delivering ? ['stock', 'product', 'project', 'client'] : [] });
        return this.findOne(id, user);
    }
    async addComentario(id, dto, user, sessionId) {
        this.assertCanManage(user);
        const existing = await this.prisma.pedidoInterno.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Pedido interno no encontrado');
        if (!dto.contenido?.trim())
            throw new common_1.BadRequestException('El comentario no puede estar vacío');
        const comentario = await this.prisma.pedidoInternoComentario.create({
            data: {
                pedidoId: id,
                autorId: user.id,
                contenido: dto.contenido.trim(),
            },
            include: { autor: { select: { id: true, name: true } } },
        });
        await this.emit('comment', id, user, sessionId);
        return comentario;
    }
};
exports.PedidosInternosService = PedidosInternosService;
exports.PedidosInternosService = PedidosInternosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        inventory_1.InventoryService])
], PedidosInternosService);
//# sourceMappingURL=pedidos-internos.service.js.map