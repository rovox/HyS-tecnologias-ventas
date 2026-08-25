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
exports.SchedulesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../auth/auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const roles_1 = require("../auth/roles");
const roles_guard_1 = require("../auth/roles.guard");
const schedule_dto_1 = require("./dto/schedule.dto");
const schedules_service_1 = require("./schedules.service");
let SchedulesController = class SchedulesController {
    schedules;
    constructor(schedules) {
        this.schedules = schedules;
    }
    list(user, estado, sucursalId, from, to, tecnicoId, quotationId, clienteId) {
        return this.schedules.list(user, { estado, sucursalId, from, to, tecnicoId, quotationId, clienteId });
    }
    get(id, user) {
        return this.schedules.get(id, user);
    }
    create(dto, user, sessionId) {
        return this.schedules.create(dto, user, sessionId);
    }
    update(id, dto, user, sessionId) {
        return this.schedules.update(id, dto, user, sessionId);
    }
    status(id, dto, user, sessionId) {
        return this.schedules.updateStatus(id, dto, user, sessionId);
    }
};
exports.SchedulesController = SchedulesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List cronograma trabajos (filters: estado, sucursalId, from, to, tecnicoId, quotationId, clienteId)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('estado')),
    __param(2, (0, common_1.Query)('sucursalId')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __param(5, (0, common_1.Query)('tecnicoId')),
    __param(6, (0, common_1.Query)('quotationId')),
    __param(7, (0, common_1.Query)('clienteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get schedule by id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS),
    (0, swagger_1.ApiOperation)({ summary: 'Create schedule job' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [schedule_dto_1.CreateScheduleDto, Object, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS, roles_1.ROLES.TEC),
    (0, swagger_1.ApiOperation)({ summary: 'Update schedule job' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schedule_dto_1.UpdateScheduleDto, Object, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_guard_1.Roles)(roles_1.ROLES.ADMIN, roles_1.ROLES.VENTAS, roles_1.ROLES.TEC),
    (0, swagger_1.ApiOperation)({ summary: 'Change schedule status' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, current_user_decorator_1.CurrentSessionId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, schedule_dto_1.ScheduleStatusDto, Object, String]),
    __metadata("design:returntype", void 0)
], SchedulesController.prototype, "status", null);
exports.SchedulesController = SchedulesController = __decorate([
    (0, swagger_1.ApiTags)('schedules'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('schedules'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [schedules_service_1.SchedulesService])
], SchedulesController);
//# sourceMappingURL=schedules.controller.js.map