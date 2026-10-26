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
exports.ReportingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_guard_1 = require("../../common/auth/auth.guard");
const current_user_decorator_1 = require("../../common/auth/current-user.decorator");
const client_report_service_1 = require("./client-report.service");
let ReportingController = class ReportingController {
    clients;
    constructor(clients) {
        this.clients = clients;
    }
    clientList(user) {
        return this.clients.clients(user);
    }
    client(id, user) {
        return this.clients.client(id, user);
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Get)('clients'),
    (0, swagger_1.ApiOperation)({ summary: 'Clients with what they owe and whether a service is in course' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "clientList", null);
__decorate([
    (0, common_1.Get)('clients/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Client page: projects with warranty, jobs, quotations, payments, visits' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ReportingController.prototype, "client", null);
exports.ReportingController = ReportingController = __decorate([
    (0, swagger_1.ApiTags)('reporting'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('reporting'),
    (0, common_1.UseGuards)(auth_guard_1.AuthGuard),
    __metadata("design:paramtypes", [client_report_service_1.ClientReportService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map