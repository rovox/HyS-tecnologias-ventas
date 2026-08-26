"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const clients_module_1 = require("./clients/clients.module");
const quotations_module_1 = require("./quotations/quotations.module");
const sucursales_module_1 = require("./sucursales/sucursales.module");
const relevamientos_module_1 = require("./relevamientos/relevamientos.module");
const goals_module_1 = require("./goals/goals.module");
const sales_module_1 = require("./sales/sales.module");
const metrics_module_1 = require("./metrics/metrics.module");
const tasks_module_1 = require("./tasks/tasks.module");
const schedules_module_1 = require("./schedules/schedules.module");
const categories_module_1 = require("./categories/categories.module");
const health_controller_1 = require("./health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            jwt_1.JwtModule.registerAsync({
                global: true,
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const secret = (config.get('JWT_SECRET') || '').trim();
                    if (!secret || secret === 'cambiar-en-hostinger') {
                        throw new Error('JWT_SECRET debe estar definido en el entorno (hPanel). No se permite el valor por defecto.');
                    }
                    return {
                        secret,
                        signOptions: { expiresIn: '8h' },
                    };
                },
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            clients_module_1.ClientsModule,
            quotations_module_1.QuotationsModule,
            sucursales_module_1.SucursalesModule,
            relevamientos_module_1.RelevamientosModule,
            goals_module_1.GoalsModule,
            sales_module_1.SalesModule,
            metrics_module_1.MetricsModule,
            tasks_module_1.TasksModule,
            schedules_module_1.SchedulesModule,
            categories_module_1.CategoriesModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map