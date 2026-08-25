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
exports.GoalsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const roles_1 = require("../auth/roles");
const roles_guard_1 = require("../auth/roles.guard");
const goal_dto_1 = require("./dto/goal.dto");
const goals_service_1 = require("./goals.service");
let GoalsController = class GoalsController {
    goals;
    constructor(goals) {
        this.goals = goals;
    }
    list(user, month) {
        return this.goals.list(user, month);
    }
    upsert(dto, user, sessionId) {
        return this.goals.upsert(dto, user, sessionId);
    }
};
exports.GoalsController = GoalsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List seller monthly goals' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "list", null);
__decorate([
    (0, common_1.Put)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Upsert goal (admin only)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [goal_dto_1.UpsertGoalDto, Object, String]),
    __metadata("design:returntype", void 0)
], GoalsController.prototype, "upsert", null);
exports.GoalsController = GoalsController = __decorate([
    (0, swagger_1.ApiTags)('goals'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('goals'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [goals_service_1.GoalsService])
], GoalsController);
//# sourceMappingURL=goals.controller.js.map