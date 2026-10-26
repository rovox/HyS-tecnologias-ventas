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
exports.RelevamientosService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
const finance_1 = require("../finance");
const relevamientos_rules_1 = require("./domain/relevamientos.rules");
const relevamiento_presenter_1 = require("./relevamiento.presenter");
function uploadDir() {
    return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), 'relevamientos');
}
const TEXT_FIELDS = [
    'hora', 'mapsLink', 'motivo', 'problemaReportado', 'equipoAfectado', 'causaProbable', 'diagnostico', 'solucion',
    'necesidadCliente', 'areaRevisar', 'medidasPuntos', 'observacionTecnica', 'observacionFinal', 'notas',
];
const FLAGS = ['requiereMaterial', 'requiereVolver', 'requiereCotizacion'];
const COMMERCIAL_ONLY = ['vendedorId', 'tecnicoId', 'sucursalId'];
const day = (value) => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
let RelevamientosService = class RelevamientosService {
    prisma;
    audit;
    income;
    constructor(prisma, audit, income) {
        this.prisma = prisma;
        this.audit = audit;
        this.income = income;
    }
    async list(user, query = {}) {
        const rows = await this.prisma.relevamiento.findMany({
            where: { ...(0, roles_1.relevamientoWhere)(user, query.cotizacionId), ...(query.clienteId ? { clienteId: query.clienteId } : {}) },
            include: relevamiento_presenter_1.VISIT_INCLUDE,
            orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
        });
        return (0, relevamiento_presenter_1.presentVisits)(this.prisma, rows);
    }
    async get(id, user) {
        const row = await this.prisma.relevamiento.findFirst({ where: { id, ...(0, roles_1.relevamientoWhere)(user) }, include: relevamiento_presenter_1.VISIT_INCLUDE });
        if (!row)
            throw new common_1.NotFoundException('Visita no encontrada');
        return (await (0, relevamiento_presenter_1.presentVisits)(this.prisma, [row]))[0];
    }
    async relatedJob(trabajoId, clienteId) {
        const job = await this.prisma.schedule.findUnique({
            where: { id: trabajoId },
            select: { clienteId: true, estado: true, fechaProgramada: true, fechaFinalizacion: true, project: { select: { estado: true, entregadoAt: true, garantiaMeses: true } } },
        });
        if (!job)
            throw new common_1.BadRequestException('Trabajo relacionado no encontrado');
        if (job.clienteId !== clienteId)
            throw new common_1.BadRequestException('El trabajo relacionado es de otro cliente');
        return (0, relevamientos_rules_1.warrantyUntil)(job);
    }
    fields(dto) {
        const data = {};
        for (const key of TEXT_FIELDS) {
            const value = dto[key];
            if (value === undefined)
                continue;
            const nullable = !['mapsLink', 'motivo', 'equipoAfectado', 'areaRevisar'].includes(key);
            data[key] = value.trim() === '' && nullable ? null : value.trim();
        }
        for (const key of FLAGS)
            if (dto[key] !== undefined)
                data[key] = dto[key];
        if (dto.fecha)
            data.fecha = day(dto.fecha);
        if (dto.fechaFin !== undefined)
            data.fechaFin = dto.fechaFin ? day(dto.fechaFin) : null;
        if (dto.tipoVisita)
            data.tipoVisita = dto.tipoVisita;
        if (dto.prioridad)
            data.prioridad = dto.prioridad;
        if (dto.lugar !== undefined)
            data.lugar = dto.lugar.trim();
        if (dto.cantidadEstimada !== undefined)
            data.cantidadEstimada = dto.cantidadEstimada;
        if (dto.vendedorId !== undefined)
            data.vendedorId = dto.vendedorId || null;
        if (dto.tecnicoId !== undefined)
            data.tecnicoId = dto.tecnicoId || null;
        if (dto.sucursalId !== undefined)
            data.sucursalId = dto.sucursalId || null;
        if (dto.garantiaHasta !== undefined)
            data.garantiaHasta = dto.garantiaHasta ? day(dto.garantiaHasta) : null;
        return data;
    }
    async create(dto, user, sessionId) {
        (0, roles_1.assertCanMutateRelevamientos)(user);
        let clienteId;
        let sucursalId = dto.sucursalId || null;
        let cotizacionId = null;
        if (dto.cotizacionId) {
            const quote = await this.prisma.quotation.findUnique({ where: { id: dto.cotizacionId } });
            if (!quote)
                throw new common_1.BadRequestException('Cotización no encontrada');
            if (!quote.clienteId)
                throw new common_1.BadRequestException('Asigna un cliente a la cotización antes del relevamiento');
            clienteId = quote.clienteId;
            sucursalId = quote.sucursalId;
            cotizacionId = quote.id;
        }
        else if (dto.clienteId) {
            const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId }, select: { sucursalId: true } });
            if (!client)
                throw new common_1.BadRequestException('Cliente no encontrado');
            clienteId = dto.clienteId;
            sucursalId = sucursalId || client.sucursalId;
        }
        else {
            throw new common_1.BadRequestException('Indica el cliente o la cotización');
        }
        if (!dto.lugar?.trim())
            throw new common_1.BadRequestException('Indica el lugar de la visita');
        const garantia = dto.trabajoRelacionadoId ? await this.relatedJob(dto.trabajoRelacionadoId, clienteId) : null;
        const tecnico = (0, roles_1.isTec)(user) && !(0, roles_1.isVentas)(user);
        const row = await this.prisma.relevamiento.create({
            data: {
                ...this.fields(dto),
                usuarioId: user.id,
                clienteId,
                sucursalId,
                cotizacionId,
                fecha: day(dto.fecha),
                lugar: dto.lugar.trim(),
                tipoVisita: dto.tipoVisita || (tecnico ? 'asistencia' : 'relevamiento'),
                estado: 'programado',
                vendedorId: dto.vendedorId || ((0, roles_1.isVentas)(user) ? user.id : null),
                tecnicoId: tecnico ? user.id : dto.tecnicoId || null,
                trabajoRelacionadoId: dto.trabajoRelacionadoId || null,
                garantiaHasta: dto.garantiaHasta ? day(dto.garantiaHasta) : garantia,
            },
            include: relevamiento_presenter_1.VISIT_INCLUDE,
        });
        await this.prisma.touchClientActivity(clienteId);
        const [visit] = await (0, relevamiento_presenter_1.presentVisits)(this.prisma, [row]);
        await this.audit.record({ user, sessionId, action: 'relevamiento.create', entity: 'relevamiento', id: row.id, after: row, affects: ['client'] });
        return visit;
    }
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateRelevamientos)(user);
        const current = await this.prisma.relevamiento.findFirst({ where: { id, ...(0, roles_1.relevamientoWhere)(user) } });
        if (!current)
            throw new common_1.NotFoundException('Visita no encontrada');
        if (!(0, roles_1.isCommercial)(user)) {
            if ((0, relevamientos_rules_1.isClosed)(current.estado))
                throw new common_1.ForbiddenException('La visita está cerrada: pide a ventas que la corrija');
            if (COMMERCIAL_ONLY.some((k) => dto[k] !== undefined && (dto[k] || null) !== current[k])) {
                throw new common_1.ForbiddenException('El técnico no cambia la sucursal ni quién atiende la visita');
            }
        }
        const data = this.fields(dto);
        if (dto.trabajoRelacionadoId !== undefined && dto.trabajoRelacionadoId !== (current.trabajoRelacionadoId ?? '')) {
            data.trabajoRelacionadoId = dto.trabajoRelacionadoId || null;
            const garantia = dto.trabajoRelacionadoId ? await this.relatedJob(dto.trabajoRelacionadoId, current.clienteId) : null;
            if (dto.garantiaHasta === undefined)
                data.garantiaHasta = garantia;
        }
        const row = await this.prisma.relevamiento.update({ where: { id }, data, include: relevamiento_presenter_1.VISIT_INCLUDE });
        await this.audit.record({ user, sessionId, action: 'relevamiento.update', entity: 'relevamiento', id, before: current, after: row, affects: ['client'] });
        return (await (0, relevamiento_presenter_1.presentVisits)(this.prisma, [row]))[0];
    }
    async changeStatus(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateRelevamientos)(user);
        const current = await this.prisma.relevamiento.findFirst({ where: { id, ...(0, roles_1.relevamientoWhere)(user) } });
        if (!current)
            throw new common_1.NotFoundException('Visita no encontrada');
        const check = (0, relevamientos_rules_1.checkVisitTransition)(current.estado, dto.estado, { fotos: (0, relevamiento_presenter_1.fotosOf)(current.fotosUrl).length, motivo: dto.motivo });
        if (!check.ok)
            throw new common_1.BadRequestException(check.reason);
        const row = await this.prisma.relevamiento.update({
            where: { id },
            data: {
                estado: dto.estado,
                ...(dto.estado === 'cancelado' ? { motivoCancelacion: dto.motivo.trim() } : {}),
                ...(dto.estado === 'resuelto' && !current.fechaFin ? { fechaFin: day(new Date().toISOString()) } : {}),
            },
            include: relevamiento_presenter_1.VISIT_INCLUDE,
        });
        await this.audit.record({ user, sessionId, action: 'relevamiento.status', entity: 'relevamiento', id, before: current, after: row, affects: ['client'] });
        return (await (0, relevamiento_presenter_1.presentVisits)(this.prisma, [row]))[0];
    }
    async registerPayment(id, dto, user, sessionId) {
        await this.get(id, user);
        await this.income.register({ relevamientoId: id }, { concepto: 'asistencia', ...dto }, user, sessionId);
        return this.get(id, user);
    }
    async attachPhoto(id, file, user, sessionId) {
        (0, roles_1.assertCanMutateRelevamientos)(user);
        const current = await this.prisma.relevamiento.findFirst({ where: { id, ...(0, roles_1.relevamientoWhere)(user) } });
        if (!current)
            throw new common_1.NotFoundException('Visita no encontrada');
        if (!file?.buffer?.length)
            throw new common_1.BadRequestException('Archivo de imagen requerido');
        if (!String(file.mimetype || '').startsWith('image/'))
            throw new common_1.BadRequestException('Solo se permiten imágenes');
        const dir = uploadDir();
        fs.mkdirSync(dir, { recursive: true });
        const name = `${id}-${Date.now()}${path.extname(file.originalname || '') || '.jpg'}`;
        fs.writeFileSync(path.join(dir, name), file.buffer);
        const fotosUrl = [...(0, relevamiento_presenter_1.fotosOf)(current.fotosUrl), `/api/files/relevamientos/${name}`];
        const row = await this.prisma.relevamiento.update({ where: { id }, data: { fotosUrl }, include: relevamiento_presenter_1.VISIT_INCLUDE });
        await this.audit.record({ user, sessionId, action: 'relevamiento.photo', entity: 'relevamiento', id, patch: { fotos: fotosUrl.length } });
        return (await (0, relevamiento_presenter_1.presentVisits)(this.prisma, [row]))[0];
    }
    async filePath(name, user) {
        const safe = path.basename(name);
        const visible = await this.prisma.relevamiento.findMany({ where: (0, roles_1.relevamientoWhere)(user), select: { fotosUrl: true } });
        if (!visible.some((row) => (0, relevamiento_presenter_1.fotosOf)(row.fotosUrl).some((url) => path.basename(url) === safe))) {
            throw new common_1.ForbiddenException('Sin acceso a esta foto');
        }
        const full = path.join(uploadDir(), safe);
        if (!fs.existsSync(full))
            throw new common_1.NotFoundException('Foto no encontrada');
        return full;
    }
};
exports.RelevamientosService = RelevamientosService;
exports.RelevamientosService = RelevamientosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        finance_1.IncomeService])
], RelevamientosService);
//# sourceMappingURL=relevamientos.service.js.map