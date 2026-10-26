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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
const categories_rules_1 = require("./domain/categories.rules");
function slugify(label) {
    return label
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 64);
}
let CategoriesService = class CategoriesService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    list() {
        return this.prisma.quotationCategory.findMany({
            where: { active: true },
            orderBy: [{ principal: 'desc' }, { sortOrder: 'asc' }, { label: 'asc' }],
        });
    }
    async assertDivision(id) {
        const row = id ? await this.prisma.quotationCategory.findUnique({ where: { id } }) : null;
        const error = (0, categories_rules_1.divisionError)(row);
        if (error)
            throw new common_1.BadRequestException(error);
        return row;
    }
    async create(dto, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const label = dto.label.trim();
        if (label.length < 2)
            throw new common_1.BadRequestException('Nombre de categoría muy corto');
        const id = (dto.id || slugify(label) || `cat_${Date.now()}`).slice(0, 64);
        const existing = await this.prisma.quotationCategory.findFirst({
            where: { OR: [{ id }, { label }] },
        });
        if (existing)
            throw new common_1.ConflictException('Ya existe una categoría con ese nombre o id');
        const maxSort = await this.prisma.quotationCategory.aggregate({ _max: { sortOrder: true } });
        const row = await this.prisma.quotationCategory.create({
            data: {
                id,
                label,
                sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
                active: true,
            },
        });
        await this.audit.record({ user, sessionId, action: 'category.create', entity: 'category', id: row.id });
        return row;
    }
    async deactivate(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const row = await this.prisma.quotationCategory.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Categoría no encontrada');
        const fixed = (0, categories_rules_1.chipChangeError)(row);
        if (fixed)
            throw new common_1.BadRequestException(fixed);
        if (dto.active === false || dto.active === undefined) {
            const updated = await this.prisma.quotationCategory.update({
                where: { id },
                data: { active: false },
            });
            await this.audit.record({ user, sessionId, action: 'category.deactivate', entity: 'category', id });
            return updated;
        }
        const updated = await this.prisma.quotationCategory.update({
            where: { id },
            data: { active: dto.active },
        });
        await this.audit.record({ user, sessionId, action: 'category.update', entity: 'category', id });
        return updated;
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map