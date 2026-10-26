"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolicitudesWebModule = void 0;
const common_1 = require("@nestjs/common");
const clients_1 = require("../clients");
const solicitudes_web_controller_1 = require("./solicitudes-web.controller");
const solicitudes_web_service_1 = require("./solicitudes-web.service");
const webhook_key_guard_1 = require("./webhook-key.guard");
let SolicitudesWebModule = class SolicitudesWebModule {
};
exports.SolicitudesWebModule = SolicitudesWebModule;
exports.SolicitudesWebModule = SolicitudesWebModule = __decorate([
    (0, common_1.Module)({
        imports: [clients_1.ClientsModule],
        controllers: [solicitudes_web_controller_1.SolicitudesWebhookController, solicitudes_web_controller_1.SolicitudesWebController],
        providers: [solicitudes_web_service_1.SolicitudesWebService, webhook_key_guard_1.WebhookKeyGuard],
    })
], SolicitudesWebModule);
//# sourceMappingURL=solicitudes-web.module.js.map