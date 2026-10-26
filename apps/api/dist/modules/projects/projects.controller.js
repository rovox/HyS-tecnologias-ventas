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
exports.ProjectsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const roles_guard_1 = require("../../common/auth/roles.guard");
const roles_1 = require("../../common/policy/roles");
const project_dto_1 = require("./dto/project.dto");
const projects_service_1 = require("./projects.service");
let ProjectsController = class ProjectsController {
    projects;
    constructor(projects) {
        this.projects = projects;
    }
    list(query, user) {
        return this.projects.list(query, user);
    }
    get(id, user) {
        return this.projects.get(id, user);
    }
    update(id, dto, user, sessionId) {
        return this.projects.update(id, dto, user, sessionId);
    }
    status(id, dto, user, sessionId) {
        return this.projects.changeStatus(id, dto, user, sessionId);
    }
    addJob(id, dto, user, sessionId) {
        return this.projects.addJob(id, dto, user, sessionId);
    }
    amount(id, dto, user, sessionId) {
        return this.projects.changeAmount(id, dto, user, sessionId);
    }
    pay(id, dto, user, sessionId) {
        return this.projects.registerPayment(id, dto, user, sessionId);
    }
};
exports.ProjectsController = ProjectsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List projects with collected, owed and warranty' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [project_dto_1.ListProjectsQuery, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Project with its jobs and payments' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Edit title, warranty months or responsible' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.UpdateProjectDto, Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/estado'),
    (0, swagger_1.ApiOperation)({ summary: 'Move the project: en_ejecucion, entregado (warranty starts), cerrado (no debt), anulado (admin, reason)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.ProjectStatusDto, Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "status", null);
__decorate([
    (0, common_1.Post)(':id/trabajos'),
    (0, swagger_1.ApiOperation)({ summary: 'Add a job of the project to the cronograma' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.CreateProjectJobDto, Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "addJob", null);
__decorate([
    (0, common_1.Patch)(':id/monto'),
    (0, swagger_1.ApiOperation)({ summary: 'Change the official amount (Gerencia, with a reason)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.ProjectAmountDto, Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "amount", null);
__decorate([
    (0, common_1.Post)(':id/cobros'),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS, roles_1.ROLES.TEC, roles_1.ROLES.CONTA),
    (0, swagger_1.ApiOperation)({ summary: 'Register a payment of the project (to be validated)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, project_dto_1.ProjectPaymentDto, Object, String]),
    __metadata("design:returntype", void 0)
], ProjectsController.prototype, "pay", null);
exports.ProjectsController = ProjectsController = __decorate([
    (0, swagger_1.ApiTags)('projects'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('projects'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard, roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    __metadata("design:paramtypes", [projects_service_1.ProjectsService])
], ProjectsController);
//# sourceMappingURL=projects.controller.js.map