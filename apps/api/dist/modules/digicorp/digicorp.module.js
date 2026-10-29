"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigicorpModule = void 0;
const common_1 = require("@nestjs/common");
const digicorp_controller_1 = require("./digicorp.controller");
const digicorp_service_1 = require("./digicorp.service");
let DigicorpModule = class DigicorpModule {
};
exports.DigicorpModule = DigicorpModule;
exports.DigicorpModule = DigicorpModule = __decorate([
    (0, common_1.Module)({
        controllers: [digicorp_controller_1.DigicorpController],
        providers: [digicorp_service_1.DigicorpService],
    })
], DigicorpModule);
//# sourceMappingURL=digicorp.module.js.map