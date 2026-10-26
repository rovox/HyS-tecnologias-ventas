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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const policy_1 = require("../../common/policy/policy");
const categories_1 = require("../categories");
const inventory_rules_1 = require("./domain/inventory.rules");
const codes_1 = require("../../common/domain/codes");
const STOCK_SELECT = { select: { cantidad: true, sucursalOrigenId: true, sucursalDestinoId: true } };
const PRODUCT_INCLUDE = { categoria: { select: { id: true, label: true } }, movements: STOCK_SELECT };
const MOVEMENT_INCLUDE = {
    producto: { select: { id: true, codigo: true, nombre: true, unidad: true } },
    sucursalOrigen: { select: { id: true, nombre: true } },
    sucursalDestino: { select: { id: true, nombre: true } },
    project: { select: { id: true, codigo: true } },
    pedidoInterno: { select: { id: true } },
    registradoPor: { select: { id: true, name: true } },
};
function presentProduct(row) {
    const { movements, ...product } = row;
    const stock = (0, inventory_rules_1.stockBySede)(movements);
    const total = (0, inventory_rules_1.totalStock)(stock);
    return { ...product, stock, stockTotal: total, stockBajo: (0, inventory_rules_1.isLowStock)(row, total) };
}
let InventoryService = class InventoryService {
    prisma;
    audit;
    categories;
    constructor(prisma, audit, categories) {
        this.prisma = prisma;
        this.audit = audit;
        this.categories = categories;
    }
    assertRead(user) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso al inventario');
    }
    assertManage(user) {
        if (!(0, policy_1.canManageInventory)(user))
            throw new common_1.ForbiddenException('Solo ventas o Gerencia gestionan el inventario');
    }
    async products(user) {
        this.assertRead(user);
        const rows = await this.prisma.product.findMany({ include: PRODUCT_INCLUDE, orderBy: [{ active: 'desc' }, { nombre: 'asc' }] });
        return rows.map(presentProduct);
    }
    async product(id, db = this.prisma) {
        const row = await db.product.findUnique({ where: { id }, include: PRODUCT_INCLUDE });
        if (!row)
            throw new common_1.NotFoundException('Producto no encontrado');
        return row;
    }
    async createProduct(dto, user, sessionId) {
        this.assertManage(user);
        await this.categories.assertDivision(dto.categoriaId);
        const codigo = dto.codigo.trim().toUpperCase();
        if (await this.prisma.product.findUnique({ where: { codigo } }))
            throw new common_1.ConflictException(`Ya existe un producto con el código ${codigo}`);
        const row = await this.prisma.product.create({
            data: { ...dto, codigo, nombre: dto.nombre.trim(), marca: dto.marca?.trim() || '', unidad: dto.unidad || 'unidad' },
            include: PRODUCT_INCLUDE,
        });
        await this.audit.record({ user, sessionId, action: 'product.create', entity: 'product', id: row.id });
        return presentProduct(row);
    }
    async updateProduct(id, dto, user, sessionId) {
        this.assertManage(user);
        const before = await this.product(id);
        if (dto.categoriaId !== undefined)
            await this.categories.assertDivision(dto.categoriaId);
        const after = await this.prisma.product.update({ where: { id }, data: dto, include: PRODUCT_INCLUDE });
        await this.audit.record({ user, sessionId, action: 'product.update', entity: 'product', id, before, after });
        return presentProduct(after);
    }
    async movements(user, productoId) {
        this.assertRead(user);
        return this.prisma.stockMovement.findMany({
            where: productoId ? { productoId } : {},
            include: MOVEMENT_INCLUDE,
            orderBy: { fecha: 'desc' },
            take: 1000,
        }).then((rows) => rows.map((m) => ({ ...m, pedidoInterno: m.pedidoInterno ? { id: m.pedidoInterno.id, codigo: (0, codes_1.orderCode)(m.pedidoInterno.id) } : null })));
    }
    async registerMovement(dto, user, sessionId) {
        if (dto.tipo !== 'ajuste')
            this.assertManage(user);
        else if (!(0, policy_1.canAdjustInventory)(user))
            throw new common_1.ForbiddenException('Solo Gerencia o Contabilidad ajustan el inventario');
        const row = await this.prisma.$transaction(async (tx) => {
            const product = await this.product(dto.productoId, tx);
            const available = dto.sucursalOrigenId ? ((0, inventory_rules_1.stockBySede)(product.movements)[dto.sucursalOrigenId] ?? 0) : 0;
            const error = (0, inventory_rules_1.stockMovementError)(dto, { productTipo: product.tipo, available, canAdjust: (0, policy_1.canAdjustInventory)(user) });
            if (error)
                throw new common_1.BadRequestException(error);
            if (dto.projectId) {
                const project = await tx.project.findUnique({ where: { id: dto.projectId } });
                if (!project || ['cerrado', 'anulado'].includes(project.estado))
                    throw new common_1.BadRequestException('El proyecto no existe o está cerrado');
            }
            const purchase = dto.tipo === 'entrada' && dto.costoUnitario !== undefined;
            if (purchase)
                await tx.product.update({ where: { id: product.id }, data: { costo: dto.costoUnitario } });
            return tx.stockMovement.create({
                data: {
                    productoId: product.id,
                    tipo: dto.tipo,
                    cantidad: dto.cantidad,
                    costoUnitario: purchase ? dto.costoUnitario : product.costo,
                    sucursalOrigenId: dto.sucursalOrigenId ?? null,
                    sucursalDestinoId: dto.sucursalDestinoId ?? null,
                    projectId: dto.projectId ?? null,
                    motivo: dto.motivo?.trim() || null,
                    nota: dto.nota || '',
                    registradoPorId: user.id,
                },
                include: MOVEMENT_INCLUDE,
            });
        });
        await this.audit.record({ user, sessionId, action: `stock.${dto.tipo}`, entity: 'stock', id: row.id, affects: ['product', ...(dto.projectId ? ['project', 'client'] : [])] });
        return row;
    }
    async deliverOrder(tx, pedido, userId) {
        const items = await tx.pedidoInternoItem.findMany({ where: { pedidoId: pedido.id } });
        const job = pedido.cronogramaId ? await tx.schedule.findUnique({ where: { id: pedido.cronogramaId }, select: { projectId: true } }) : null;
        const plan = (0, inventory_rules_1.movementsForDelivery)({ ...pedido, projectId: job?.projectId ?? null, forJob: Boolean(pedido.cronogramaId) }, items);
        if (typeof plan === 'string')
            throw new common_1.BadRequestException(plan);
        for (const move of plan) {
            const product = await this.product(move.productoId, tx);
            const available = (0, inventory_rules_1.stockBySede)(product.movements)[move.sucursalOrigenId] ?? 0;
            const error = (0, inventory_rules_1.stockMovementError)(move, { productTipo: product.tipo, available, canAdjust: false });
            if (error)
                throw new common_1.BadRequestException(`${product.nombre}: ${error}`);
            await tx.stockMovement.create({ data: { ...move, costoUnitario: product.costo, pedidoInternoId: pedido.id, registradoPorId: userId } });
        }
        return plan.length;
    }
    async assertProducts(ids) {
        const unique = [...new Set(ids.filter(Boolean))];
        if (!unique.length)
            return;
        const found = await this.prisma.product.count({ where: { id: { in: unique }, active: true } });
        if (found !== unique.length)
            throw new common_1.BadRequestException('Un producto del pedido no existe o está archivado');
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        categories_1.CategoriesService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map