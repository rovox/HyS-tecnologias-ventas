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
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
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
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    list() {
        return this.prisma.quotationCategory.findMany({
            where: { active: true },
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        });
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
        await this.activity.log(user.id, sessionId, 'category.create', 'quotation_category', row.id);
        return row;
    }
    async deactivate(id, dto, user, sessionId) {
        (0, roles_1.assertCanMutateQuotes)(user);
        const row = await this.prisma.quotationCategory.findUnique({ where: { id } });
        if (!row)
            throw new common_1.NotFoundException('Categoría no encontrada');
        if (dto.active === false || dto.active === undefined) {
            const updated = await this.prisma.quotationCategory.update({
                where: { id },
                data: { active: false },
            });
            await this.activity.log(user.id, sessionId, 'category.deactivate', 'quotation_category', id);
            return updated;
        }
        const updated = await this.prisma.quotationCategory.update({
            where: { id },
            data: { active: dto.active },
        });
        await this.activity.log(user.id, sessionId, 'category.update', 'quotation_category', id);
        return updated;
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map