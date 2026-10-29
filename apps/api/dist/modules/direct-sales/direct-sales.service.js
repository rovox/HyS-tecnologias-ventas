"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DirectSalesService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const calendar_1 = require("../../common/domain/calendar");
const policy_1 = require("../../common/policy/policy");
const inventory_1 = require("../inventory");
const direct_sales_rules_1 = require("./domain/direct-sales.rules");
const sale_note_1 = require("./sale-note");
const notesDir = () => path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), 'notas-venta');
async function storeNote(name, bytes) {
    await fs_1.promises.mkdir(notesDir(), { recursive: true });
    await fs_1.promises.writeFile(path.join(notesDir(), name), bytes);
    return name;
}
const USER_NAME = { select: { id: true, name: true, phone: true } };
const SALE_DETAIL = {
    sucursal: { select: { id: true, nombre: true, direccion: true } },
    vendedor: USER_NAME,
    anuladaPor: USER_NAME,
    cliente: { select: { id: true, nombre: true } },
    items: true,
    cobros: { select: { id: true, medioPago: true, monto: true, estado: true, cajaId: true, caja: { select: { id: true, nombre: true } } } },
    reemplazaA: { select: { id: true, numero: true } },
    reemplazadaPor: { select: { id: true, numero: true } },
};
const presentSale = ({ notaPdfPath, notaAnuladaPdfPath, ...row }) => ({
    ...row,
    codigo: (0, direct_sales_rules_1.saleNumber)(row.numero),
    tieneNota: Boolean(notaPdfPath),
});
const seller = (user) => ({ manager: (0, policy_1.isAdmin)(user), seller: (0, policy_1.isVentas)(user), sucursalId: user.sucursalId });
let DirectSalesService = class DirectSalesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    assertSeller(user) {
        if (!(0, policy_1.isAdmin)(user) && !(0, policy_1.isVentas)(user))
            throw new common_1.ForbiddenException('Solo ventas, Administración o Contabilidad venden');
    }
    async list(query, user) {
        this.assertSeller(user);
        const rows = await this.prisma.directSale.findMany({
            where: {
                ...(query.sucursalId ? { sucursalId: query.sucursalId } : {}),
                ...(query.vendedorId ? { vendedorId: query.vendedorId } : {}),
                ...(query.estado ? { estado: query.estado } : {}),
                ...(query.desde || query.hasta
                    ? { fecha: { ...(query.desde ? { gte: (0, calendar_1.businessDayStart)(query.desde.slice(0, 10)) } : {}), ...(query.hasta ? { lte: (0, calendar_1.businessDayEnd)(query.hasta.slice(0, 10)) } : {}) } }
                    : {}),
            },
            include: SALE_DETAIL,
            orderBy: { numero: 'desc' },
            take: 1000,
        });
        return rows.map(presentSale);
    }
    async row(id, tx = this.prisma) {
        const row = await tx.directSale.findUnique({ where: { id }, include: SALE_DETAIL });
        if (!row)
            throw new common_1.NotFoundException('Venta no encontrada');
        return row;
    }
    async get(id, user) {
        this.assertSeller(user);
        return presentSale(await this.row(id));
    }
    async note(id, user, original = false) {
        this.assertSeller(user);
        const sale = await this.row(id);
        const name = !original && sale.notaAnuladaPdfPath ? sale.notaAnuladaPdfPath : sale.notaPdfPath;
        if (!name)
            throw new common_1.NotFoundException('Esta venta no tiene nota guardada');
        const bytes = await fs_1.promises.readFile(path.join(notesDir(), path.basename(name))).catch(() => {
            throw new common_1.NotFoundException('No se encontró el archivo de la nota en el servidor');
        });
        return { bytes, name: `Nota-${(0, direct_sales_rules_1.saleNumber)(sale.numero)}${name.includes('anulada') ? '-ANULADA' : ''}.pdf` };
    }
    async createIn(tx, dto, user) {
        this.assertSeller(user);
        if (!(0, direct_sales_rules_1.canSellFromBranch)(seller(user), dto.sucursalId))
            throw new common_1.ForbiddenException('Vendes desde tu sucursal o desde Central');
        const sucursal = await tx.sucursal.findUnique({ where: { id: dto.sucursalId } });
        if (!sucursal)
            throw new common_1.BadRequestException('Sucursal no encontrada');
        const client = dto.clienteId ? await tx.client.findUnique({ where: { id: dto.clienteId } }) : null;
        if (dto.clienteId && !client)
            throw new common_1.BadRequestException('Cliente no encontrado');
        if (dto.reemplazaAId) {
            const replaced = await tx.directSale.findUnique({ where: { id: dto.reemplazaAId }, include: { reemplazadaPor: { select: { id: true } } } });
            if (!replaced || replaced.estado !== 'anulada')
                throw new common_1.BadRequestException('Solo se reemplaza una venta anulada');
            if (replaced.reemplazadaPor)
                throw new common_1.BadRequestException('Esa venta ya tiene su reemplazo');
        }
        const ids = [...new Set(dto.items.map((i) => i.productoId))];
        const products = await tx.product.findMany({ where: { id: { in: ids } }, include: { movements: { select: { cantidad: true, sucursalOrigenId: true, sucursalDestinoId: true } } } });
        const byId = new Map(products.map((p) => [p.id, p]));
        for (const id of ids) {
            const p = byId.get(id);
            if (!p || !p.active)
                throw new common_1.BadRequestException('Producto no encontrado o archivado');
            if (p.tipo === 'servicio')
                throw new common_1.BadRequestException(`${p.nombre} es un servicio: no tiene stock que vender`);
        }
        const available = Object.fromEntries(products.map((p) => [p.id, (0, inventory_1.stockBySede)(p.movements)[dto.sucursalId] ?? 0]));
        const descuento = dto.descuento ?? 0;
        const error = (0, direct_sales_rules_1.saleError)(dto.items, descuento, dto.pagos, available);
        if (error)
            throw new common_1.BadRequestException(error);
        const boxes = await tx.cashBox.findMany();
        const payments = dto.pagos.map((p) => ({ ...p, cajaId: (0, direct_sales_rules_1.boxForPayment)(p.medio, dto.sucursalId, boxes) }));
        const missing = payments.find((p) => !p.cajaId);
        if (missing)
            throw new common_1.BadRequestException(`No hay caja para cobros por ${missing.medio} en esta sucursal: pide a Gerencia que la cree`);
        const counter = await tx.docCounter.upsert({ where: { id: 'nota_venta' }, create: { id: 'nota_venta', valor: 1 }, update: { valor: { increment: 1 } } });
        const totals = (0, direct_sales_rules_1.saleTotals)(dto.items, descuento);
        const now = new Date();
        const sale = await tx.directSale.create({
            data: {
                numero: counter.valor,
                sucursalId: dto.sucursalId,
                vendedorId: user.id,
                clienteId: client?.id ?? null,
                clienteNombre: dto.clienteNombre?.trim() || client?.nombre || 'Cliente varios',
                clienteCelular: dto.clienteCelular?.trim() || client?.telefono || '',
                clienteNit: dto.clienteNit?.trim() || '',
                subtotal: totals.subtotal,
                descuento: totals.descuento,
                total: totals.total,
                reemplazaAId: dto.reemplazaAId ?? null,
                fecha: now,
                items: {
                    create: totals.items.map((line, i) => {
                        const p = byId.get(dto.items[i].productoId);
                        return { productoId: p.id, codigo: p.codigo, descripcion: p.nombre.slice(0, 300), unidad: p.unidad, cantidad: line.cantidad, precioUnitario: line.precioUnitario, descuento: line.descuento, subtotal: line.subtotal };
                    }),
                },
            },
        });
        const code = (0, direct_sales_rules_1.saleNumber)(sale.numero);
        await tx.stockMovement.createMany({
            data: dto.items.map((line) => ({
                productoId: line.productoId,
                tipo: 'salida_venta_directa',
                cantidad: line.cantidad,
                costoUnitario: byId.get(line.productoId).costo,
                sucursalOrigenId: dto.sucursalId,
                ventaDirectaId: sale.id,
                nota: `Venta ${code}`,
                registradoPorId: user.id,
                fecha: now,
            })),
        });
        await tx.cashMovement.createMany({
            data: payments.map((p) => ({
                tipo: 'ingreso',
                concepto: 'venta_directa',
                monto: p.monto,
                metodo: p.medio,
                medioPago: p.medio,
                nota: `Venta ${code}`,
                fecha: now,
                estado: 'validado',
                cajaId: p.cajaId,
                sucursalId: dto.sucursalId,
                clienteId: client?.id ?? null,
                ventaDirectaId: sale.id,
                registradoPorId: user.id,
                recibidoPorId: user.id,
                validadoPorId: user.id,
                validadoAt: now,
            })),
        });
        const full = await this.row(sale.id, tx);
        const notaPdfPath = await storeNote(`${code}-${sale.id}.pdf`, await (0, sale_note_1.renderSaleNote)(full));
        await tx.directSale.update({ where: { id: sale.id }, data: { notaPdfPath } });
        return { ...full, notaPdfPath };
    }
    async create(dto, user, sessionId) {
        const sale = await this.prisma.$transaction((tx) => this.createIn(tx, dto, user));
        await this.audit.record({ user, sessionId, action: 'directSale.create', entity: 'directSale', id: sale.id, affects: ['product', 'stock', 'movement', 'client'], patch: { estado: sale.estado } });
        return presentSale(sale);
    }
    async annulIn(tx, id, dto, user) {
        if (!(0, policy_1.isAdmin)(user))
            throw new common_1.ForbiddenException('Solo Administración o Contabilidad anulan una venta');
        const sale = await this.row(id, tx);
        const error = (0, direct_sales_rules_1.annulError)(sale, dto.motivo);
        if (error)
            throw new common_1.BadRequestException(error);
        const now = new Date();
        const code = (0, direct_sales_rules_1.saleNumber)(sale.numero);
        await tx.stockMovement.createMany({
            data: sale.items.map((line) => ({
                productoId: line.productoId,
                tipo: 'devolucion_venta',
                cantidad: line.cantidad,
                sucursalDestinoId: sale.sucursalId,
                ventaDirectaId: sale.id,
                motivo: dto.motivo.trim(),
                nota: `Anulación de ${code}`,
                registradoPorId: user.id,
                fecha: now,
            })),
        });
        await tx.cashMovement.updateMany({ where: { ventaDirectaId: sale.id, estado: { not: 'anulado' } }, data: { estado: 'anulado', motivo: `Venta ${code} anulada: ${dto.motivo.trim()}` } });
        await tx.directSale.update({ where: { id }, data: { estado: 'anulada', motivoAnulacion: dto.motivo.trim(), anuladaPorId: user.id, anuladaAt: now } });
        const annulled = await this.row(id, tx);
        const notaAnuladaPdfPath = await storeNote(`${code}-${sale.id}-anulada.pdf`, await (0, sale_note_1.renderSaleNote)(annulled, { annulled: true }));
        await tx.directSale.update({ where: { id }, data: { notaAnuladaPdfPath } });
        return { ...annulled, notaAnuladaPdfPath };
    }
    async annul(id, dto, user, sessionId) {
        const before = await this.row(id);
        const sale = await this.prisma.$transaction((tx) => this.annulIn(tx, id, dto, user));
        await this.audit.record({ user, sessionId, action: 'directSale.annul', entity: 'directSale', id, before: { estado: before.estado }, after: { estado: sale.estado, motivo: dto.motivo }, affects: ['product', 'stock', 'movement', 'client'] });
        return presentSale(sale);
    }
};
exports.DirectSalesService = DirectSalesService;
exports.DirectSalesService = DirectSalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], DirectSalesService);
//# sourceMappingURL=direct-sales.service.js.map