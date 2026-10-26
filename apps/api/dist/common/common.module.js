"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
const realtime_service_1 = require("./realtime/realtime.service");
const realtime_controller_1 = require("./realtime/realtime.controller");
const audit_service_1 = require("./audit/audit.service");
const auth_guard_1 = require("./auth/auth.guard");
const roles_guard_1 = require("./auth/roles.guard");
let CommonModule = class CommonModule {
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        controllers: [realtime_controller_1.RealtimeController],
        providers: [prisma_service_1.PrismaService, realtime_service_1.RealtimeService, audit_service_1.AuditService, auth_guard_1.AuthGuard, roles_guard_1.RolesGuard],
        exports: [prisma_service_1.PrismaService, realtime_service_1.RealtimeService, audit_service_1.AuditService, auth_guard_1.AuthGuard, roles_guard_1.RolesGuard],
    })
], CommonModule);
//# sourceMappingURL=common.module.js.map