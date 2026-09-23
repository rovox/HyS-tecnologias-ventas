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
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
const realtime_service_1 = require("../realtime/realtime.service");
const ESTADOS = ['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'];
function uploadDir() {
    return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), 'relevamientos');
}
function fotosList(fotosUrl) {
    if (!fotosUrl)
        return [];
    if (Array.isArray(fotosUrl))
        return fotosUrl.map(String).filter(Boolean);
    if (typeof fotosUrl === 'object' && fotosUrl !== null && Array.isArray(fotosUrl.urls)) {
        return (fotosUrl.urls || []).map(String).filter(Boolean);
    }
    return [];
}
let RelevamientosService = class RelevamientosService {
    prisma;
    activity;
    realtime;
    constructor(prisma, activity, realtime) {
        this.prisma = prisma;
        this.activity = activity;
        this.realtime = realtime;
    }
    list(user, cotizacionId) {
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
                estado: dto.estado || 'programado',
                prioridad: dto.prioridad || 'media',
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
        this.realtime.emit('relevamiento.created', 'relevamiento', row.id, {
            byUserId: user.id,
            patch: { estado: row.estado, prioridad: row.prioridad, fecha: row.fecha },
        });
        return row;
    }
    async update(id, dto, user, sessionId) {
        const current = await this.get(id, user);
        if (dto.estado && !ESTADOS.includes(dto.estado)) {
            throw new common_1.BadRequestException('Estado de visita no válido');
        }
        if (dto.estado === 'resuelto') {
            const fotos = fotosList(dto.fotosUrl !== undefined ? dto.fotosUrl : current.fotosUrl);
            if (fotos.length < 1) {
                throw new common_1.BadRequestException('Debes subir al menos una foto de evidencia para marcar como resuelto');
            }
        }
        const row = await this.prisma.relevamiento.update({
            where: { id },
            data: {
                ...(dto.fecha ? { fecha: new Date(dto.fecha) } : {}),
                ...(dto.fechaFin !== undefined ? { fechaFin: dto.fechaFin ? new Date(dto.fechaFin) : null } : {}),
                ...(dto.tipoVisita ? { tipoVisita: dto.tipoVisita } : {}),
                ...(dto.estado ? { estado: dto.estado } : {}),
                ...(dto.prioridad ? { prioridad: dto.prioridad } : {}),
                ...(dto.vendedorId !== undefined ? { vendedorId: dto.vendedorId || null } : {}),
                ...(dto.tecnicoId !== undefined ? { tecnicoId: dto.tecnicoId || null } : {}),
                ...(dto.lugar ? { lugar: dto.lugar.trim() } : {}),
                ...(dto.notas !== undefined ? { notas: dto.notas } : {}),
                ...(dto.fotosUrl !== undefined ? { fotosUrl: dto.fotosUrl } : {}),
            },
        });
        await this.activity.log(user.id, sessionId, 'relevamiento.update', 'relevamiento', id);
        this.realtime.emit('relevamiento.updated', 'relevamiento', id, {
            byUserId: user.id,
            patch: {
                estado: row.estado,
                prioridad: row.prioridad,
                fotosCount: fotosList(row.fotosUrl).length,
            },
        });
        return row;
    }
    async attachPhoto(id, file, user, sessionId) {
        const current = await this.get(id, user);
        if (!file?.buffer?.length)
            throw new common_1.BadRequestException('Archivo de imagen requerido');
        const mime = String(file.mimetype || '');
        if (!mime.startsWith('image/'))
            throw new common_1.BadRequestException('Solo se permiten imágenes');
        const dir = uploadDir();
        fs.mkdirSync(dir, { recursive: true });
        const ext = path.extname(file.originalname || '') || '.jpg';
        const name = `${id}-${Date.now()}${ext}`;
        const full = path.join(dir, name);
        fs.writeFileSync(full, file.buffer);
        const url = `/api/files/relevamientos/${name}`;
        const prev = fotosList(current.fotosUrl);
        const fotosUrl = [...prev, url];
        const row = await this.prisma.relevamiento.update({
            where: { id },
            data: { fotosUrl },
        });
        await this.activity.log(user.id, sessionId, 'relevamiento.photo', 'relevamiento', id);
        this.realtime.emit('relevamiento.updated', 'relevamiento', id, {
            byUserId: user.id,
            patch: { fotosCount: fotosUrl.length },
        });
        return row;
    }
    async filePath(name) {
        const safe = path.basename(name);
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
        activity_service_1.ActivityService,
        realtime_service_1.RealtimeService])
], RelevamientosService);
//# sourceMappingURL=relevamientos.service.js.map