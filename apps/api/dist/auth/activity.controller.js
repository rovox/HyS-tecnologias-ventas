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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("./auth.guard");
const roles_guard_1 = require("./roles.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let ActivityController = class ActivityController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(limit, userId, action) {
        const take = Math.min(Number(limit) || 100, 500);
        return this.prisma.activity.findMany({
            take,
            orderBy: { at: 'desc' },
            where: {
                ...(userId ? { userId } : {}),
                ...(action ? { action: { contains: action } } : {}),
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        });
    }
};
exports.ActivityController = ActivityController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_guard_1.Roles)('ADMINISTRADOR'),
    (0, swagger_1.ApiOperation)({ summary: 'List audit activity log' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('userId')),
    __param(2, (0, common_1.Query)('action')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "list", null);
exports.ActivityController = ActivityController = __decorate([
    (0, swagger_1.ApiTags)('activity'),
    (0, common_1.Controller)('activity'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityController);
//# sourceMappingURL=activity.controller.js.map