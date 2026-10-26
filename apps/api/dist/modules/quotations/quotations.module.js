"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuotationsModule = void 0;
const common_1 = require("@nestjs/common");
const quotations_controller_1 = require("./quotations.controller");
const quotations_service_1 = require("./quotations.service");
const quotation_files_service_1 = require("./quotation-files.service");
const quotation_flow_service_1 = require("./quotation-flow.service");
const categories_1 = require("../categories");
const tasks_1 = require("../tasks");
const projects_1 = require("../projects");
let QuotationsModule = class QuotationsModule {
};
exports.QuotationsModule = QuotationsModule;
exports.QuotationsModule = QuotationsModule = __decorate([
    (0, common_1.Module)({
        imports: [categories_1.CategoriesModule, tasks_1.TasksModule, projects_1.ProjectsModule],
        controllers: [quotations_controller_1.QuotationsController, quotations_controller_1.QuotationFilesController],
        providers: [quotations_service_1.QuotationsService, quotation_flow_service_1.QuotationFlowService, quotation_files_service_1.QuotationFilesService],
    })
], QuotationsModule);
//# sourceMappingURL=quotations.module.js.map