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
const common_module_1 = require("./common/common.module");
const auth_1 = require("./modules/auth");
const clients_1 = require("./modules/clients");
const quotations_1 = require("./modules/quotations");
const sucursales_1 = require("./modules/sucursales");
const relevamientos_1 = require("./modules/relevamientos");
const goals_1 = require("./modules/goals");
const metrics_1 = require("./modules/metrics");
const tasks_1 = require("./modules/tasks");
const schedules_1 = require("./modules/schedules");
const categories_1 = require("./modules/categories");
const pedidos_internos_1 = require("./modules/pedidos-internos");
const solicitudes_web_1 = require("./modules/solicitudes-web");
const projects_1 = require("./modules/projects");
const finance_1 = require("./modules/finance");
const reporting_1 = require("./modules/reporting");
const inventory_1 = require("./modules/inventory");
const direct_sales_1 = require("./modules/direct-sales");
const digicorp_1 = require("./modules/digicorp");
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
            common_module_1.CommonModule,
            auth_1.AuthModule,
            clients_1.ClientsModule,
            quotations_1.QuotationsModule,
            sucursales_1.SucursalesModule,
            relevamientos_1.RelevamientosModule,
            goals_1.GoalsModule,
            metrics_1.MetricsModule,
            tasks_1.TasksModule,
            schedules_1.SchedulesModule,
            categories_1.CategoriesModule,
            pedidos_internos_1.PedidosInternosModule,
            solicitudes_web_1.SolicitudesWebModule,
            projects_1.ProjectsModule,
            finance_1.FinanceModule,
            reporting_1.ReportingModule,
            inventory_1.InventoryModule,
            direct_sales_1.DirectSalesModule,
            digicorp_1.DigicorpModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map