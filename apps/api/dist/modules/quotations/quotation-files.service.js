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
exports.QuotationFilesService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path = __importStar(require("path"));
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
const quotations_rules_1 = require("./domain/quotations.rules");
const quotations_service_1 = require("./quotations.service");
function uploadDir() {
    return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
}
let QuotationFilesService = class QuotationFilesService {
    prisma;
    audit;
    quotations;
    constructor(prisma, audit, quotations) {
        this.prisma = prisma;
        this.audit = audit;
        this.quotations = quotations;
    }
    async attachFile(id, file, user, sessionId, kind = 'pdf') {
        (0, roles_1.assertCanMutateQuotes)(user);
        const quote = await this.quotations.get(id, user);
        const blocked = (0, quotations_rules_1.editError)(quote, {});
        if (blocked)
            throw new common_1.BadRequestException(blocked);
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
        });
        await this.audit.record({
            user,
            sessionId,
            action: kind === 'licitacion' ? 'quotation.licitacion-file' : kind === 'prerequisito' ? 'quotation.prerequisito-file' : 'quotation.file',
            entity: 'quotation',
            id,
            patch: { archivo: updated.archivo },
        });
        return this.quotations.get(id, user);
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
};
exports.QuotationFilesService = QuotationFilesService;
exports.QuotationFilesService = QuotationFilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        quotations_service_1.QuotationsService])
], QuotationFilesService);
//# sourceMappingURL=quotation-files.service.js.map