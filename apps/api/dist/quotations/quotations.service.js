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
exports.QuotationsService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
const FLOW = {
    borrador: ['enviado', 'rechazado'],
    enviado: ['aceptado', 'rechazado', 'borrador'],
    aceptado: ['rechazado'],
    rechazado: ['borrador'],
};
function uploadDir() {
    return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
}
let QuotationsService = class QuotationsService {
    prisma;
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
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
    list(filters, user) {
        if ((0, roles_1.isTec)(user) || (0, roles_1.isCont)(user))
            throw new common_1.ForbiddenException('Sin acceso a cotizaciones');
        return this.prisma.quotation.findMany({
            where: {
                ...(0, roles_1.quotationWhere)(user),
                ...(filters.estado ? { estado: filters.estado } : {}),
                ...(filters.vendedorId && !(0, roles_1.isCont)(user) ? { vendedorId: filters.vendedorId } : {}),
                ...(filters.sucursalId ? { sucursalId: filters.sucursalId } : {}),
            },
            include: { sellers: true, cliente: true, sucursal: true, sale: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async get(id, user) {
        const row = await this.prisma.quotation.findFirst({
            where: { id, ...(user ? (0, roles_1.quotationWhere)(user) : {}) },
            include: { sellers: true, cliente: true, sucursal: true, sale: { include: { jobs: true, payments: true } } },
        });
        if (!row)
            throw new common_1.NotFoundException('Cotización no encontrada');
        return row;
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
                categoria: dto.categoria || 'Sin categoría',
                categoriaId: dto.categoriaId || '',
                subcategoria: dto.subcategoria || '',
                sucursalId: sucursal.id,
                sucursalNombre: sucursal.nombre,
                clienteId: dto.clienteId || null,
                estado: 'borrador',
                monto: dto.monto ?? 1,
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
            include: { sellers: true, cliente: true, sucursal: true },
        });
        await this.prisma.touchClientActivity(dto.clienteId);
        await this.activity.log(user.id, sessionId, 'quotation.create', 'quotation', quote.id);
        return quote;
    }
    async updateStatus(id, estado, user, sessionId, motivoRechazo, fechaEnvio) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.get(id, user);
        const allowed = FLOW[current.estado] || [];
        if (!allowed.includes(estado)) {
            throw new common_1.BadRequestException(`Transición inválida: ${current.estado} → ${estado}`);
        }
        if (estado === 'enviado' && !current.archivoPdfUrl) {
            throw new common_1.BadRequestException('Adjunta el PDF antes de enviar la cotización');
        }
        if (estado === 'rechazado' && !motivoRechazo?.trim() && current.estado !== 'borrador') {
        }
        const quote = await this.prisma.quotation.update({
            where: { id },
            data: {
                estado,
                ...(estado === 'rechazado' ? { motivoRechazo: motivoRechazo || current.motivoRechazo } : {}),
                ...(fechaEnvio ? { fechaEnvio: new Date(fechaEnvio) } : {}),
            },
        });
        await this.prisma.touchClientActivity(current.clienteId);
        await this.activity.log(user.id, sessionId, 'quotation.status', 'quotation', id);
        return quote;
    }
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.get(id, user);
        const vendors = dto.vendedores?.filter((row) => row.userId);
        if (vendors) {
            if (vendors.length === 0)
                throw new common_1.BadRequestException('Selecciona al menos un vendedor');
            this.assertCommission(vendors);
        }
        if (dto.clienteId && dto.clienteId !== current.clienteId) {
            if (current.estado === 'aceptado' || current.estado === 'rechazado') {
                throw new common_1.BadRequestException('No se puede cambiar el cliente de una cotización cerrada');
            }
            const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
            if (!client)
                throw new common_1.BadRequestException('Cliente no encontrado');
        }
        if (dto.monto !== undefined && (current.estado === 'aceptado' || current.estado === 'rechazado')) {
            throw new common_1.BadRequestException('No se puede cambiar el monto de una cotización cerrada');
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
                    ...(dto.categoria !== undefined ? { categoria: dto.categoria } : {}),
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
                include: { sellers: true, cliente: true, sucursal: true },
            });
        });
        const finalClientId = dto.clienteId || current.clienteId;
        await this.prisma.touchClientActivity(finalClientId);
        await this.activity.log(user.id, sessionId, 'quotation.update', 'quotation', id);
        return quote;
    }
    async attachFile(id, file, user, sessionId, kind = 'pdf') {
        (0, roles_1.assertCanMutateQuotes)(user);
        const quote = await this.get(id, user);
        const bytes = file?.buffer?.length ? file.buffer : file?.path ? await fs_1.promises.readFile(file.path) : null;
        if (!bytes?.length)
            throw new common_1.BadRequestException('Archivo vacío');
        const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
        const safeExt = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.bin';
        const stored = `${id}-${Date.now()}${safeExt}`;
        const dir = uploadDir();
        await fs_1.promises.mkdir(dir, { recursive: true });
        const full = path.join(dir, stored);
        await fs_1.promises.writeFile(full, bytes);
        const archivoPdfUrl = `/api/files/quotations/${stored}`;
        const isDocPack = kind === 'licitacion' || kind === 'prerequisito';
        const existing = Array.isArray(quote.licitacionArchivos)
            ? quote.licitacionArchivos
            : [];
        const updated = await this.prisma.quotation.update({
            where: { id },
            data: isDocPack
                ? {
                    ...(kind === 'licitacion' ? { tieneLicitacion: true } : {}),
                    licitacionArchivos: [...existing, {
                            name: file.originalname || stored,
                            url: archivoPdfUrl,
                            kind,
                        }],
                }
                : { archivo: file.originalname || stored, archivoPdfUrl },
            include: { sellers: true, cliente: true, sucursal: true },
        });
        await this.activity.log(user.id, sessionId, kind === 'licitacion' ? 'quotation.licitacion-file' : kind === 'prerequisito' ? 'quotation.prerequisito-file' : 'quotation.file', 'quotation', id);
        return updated;
    }
    async filePath(name, user) {
        const safe = path.basename(name);
        const full = path.join(uploadDir(), safe);
        const quote = await this.prisma.quotation.findFirst({
            where: {
                ...(0, roles_1.quotationWhere)(user),
                OR: [{ archivoPdfUrl: { contains: safe } }, { archivo: safe }],
            },
        });
        const licensed = quote || (await this.prisma.quotation.findMany({
            where: (0, roles_1.quotationWhere)(user),
            select: { id: true, licitacionArchivos: true },
        })).find((row) => JSON.stringify(row.licitacionArchivos || '').includes(safe));
        if (!licensed)
            throw new common_1.ForbiddenException('Sin acceso a este archivo');
        try {
            await fs_1.promises.access(full);
        }
        catch {
            throw new common_1.NotFoundException('Archivo no encontrado');
        }
        return full;
    }
    async accept(id, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const current = await this.get(id, user);
        if (current.sale)
            return { quotation: current, sale: current.sale, alreadyConverted: true };
        if (current.estado === 'rechazado')
            throw new common_1.BadRequestException('Una cotización rechazada no crea venta');
        if (current.estado !== 'enviado' && current.estado !== 'aceptado') {
            throw new common_1.BadRequestException('La cotización no se puede aceptar');
        }
        const sale = await this.prisma.$transaction(async (tx) => {
            await tx.quotation.update({ where: { id }, data: { estado: 'aceptado' } });
            return tx.sale.create({
                data: {
                    quotationId: id,
                    total: current.monto,
                    jobs: {
                        create: {
                            titulo: current.titulo,
                            estado: 'programado',
                            monto: current.monto,
                        },
                    },
                },
                include: { jobs: true, payments: true },
            });
        });
        await this.prisma.touchClientActivity(current.clienteId);
        await this.activity.log(user.id, sessionId, 'quotation.accept', 'sale', sale.id);
        const quotation = await this.get(id, user);
        return { quotation, sale, alreadyConverted: false };
    }
};
exports.QuotationsService = QuotationsService;
exports.QuotationsService = QuotationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], QuotationsService);
//# sourceMappingURL=quotations.service.js.map