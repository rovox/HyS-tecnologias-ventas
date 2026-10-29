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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectPaymentDto = exports.ProjectAmountDto = exports.CreateProjectJobDto = exports.ProjectStatusDto = exports.UpdateProjectDto = exports.ListProjectsQuery = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const projects_rules_1 = require("../domain/projects.rules");
const emptyToUndef = ({ value }) => (value === '' || value === null ? undefined : value);
const clearable = ({ value }) => (value === null ? '' : value);
class ListProjectsQuery {
    estado;
    clienteId;
}
exports.ListProjectsQuery = ListProjectsQuery;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: projects_rules_1.PROJECT_ESTADOS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(projects_rules_1.PROJECT_ESTADOS),
    __metadata("design:type", String)
], ListProjectsQuery.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListProjectsQuery.prototype, "clienteId", void 0);
class UpdateProjectDto {
    titulo;
    garantiaMeses;
    responsableId;
}
exports.UpdateProjectDto = UpdateProjectDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0, maximum: 120 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(120),
    __metadata("design:type", Number)
], UpdateProjectDto.prototype, "garantiaMeses", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateProjectDto.prototype, "responsableId", void 0);
class ProjectStatusDto {
    estado;
    motivo;
}
exports.ProjectStatusDto = ProjectStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: projects_rules_1.PROJECT_ESTADOS }),
    (0, class_validator_1.IsIn)(projects_rules_1.PROJECT_ESTADOS, { message: 'Estado de proyecto no válido' }),
    __metadata("design:type", String)
], ProjectStatusDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Required to cancel (anulado)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectStatusDto.prototype, "motivo", void 0);
class CreateProjectJobDto {
    descripcionTrabajo;
    fechaProgramada;
    horario;
    tecnicoId;
    lugar;
}
exports.CreateProjectJobDto = CreateProjectJobDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Describe el trabajo' }),
    __metadata("design:type", String)
], CreateProjectJobDto.prototype, "descripcionTrabajo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO date' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateProjectJobDto.prototype, "fechaProgramada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateProjectJobDto.prototype, "horario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateProjectJobDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateProjectJobDto.prototype, "lugar", void 0);
class ProjectAmountDto {
    montoOficial;
    motivo;
}
exports.ProjectAmountDto = ProjectAmountDto;
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], ProjectAmountDto.prototype, "montoOficial", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Indica el motivo del cambio de monto' }),
    __metadata("design:type", String)
], ProjectAmountDto.prototype, "motivo", void 0);
class ProjectPaymentDto {
    concepto;
    monto;
    metodo;
    nota;
    recibidoPorId;
    cuentaDestino;
}
exports.ProjectPaymentDto = ProjectPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['adelanto', 'cobro', 'adicional'] }),
    (0, class_validator_1.IsIn)(['adelanto', 'cobro', 'adicional'], { message: 'Tipo de cobro no válido' }),
    __metadata("design:type", String)
], ProjectPaymentDto.prototype, "concepto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], ProjectPaymentDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectPaymentDto.prototype, "metodo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectPaymentDto.prototype, "nota", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Who received the money (default: who registers it)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProjectPaymentDto.prototype, "recibidoPorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['qr_empresa', 'qr_socia', 'qr_personal'], description: 'QR payments only: which QR it reached (LAUNCH P1-1)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['qr_empresa', 'qr_socia', 'qr_personal'], { message: 'Cuenta destino no válida' }),
    __metadata("design:type", String)
], ProjectPaymentDto.prototype, "cuentaDestino", void 0);
//# sourceMappingURL=project.dto.js.map