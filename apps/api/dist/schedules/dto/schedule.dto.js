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
exports.ScheduleStatusDto = exports.UpdateScheduleDto = exports.CreateScheduleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const emptyToUndef = ({ value }) => (value === '' || value === null ? undefined : value);
class CreateScheduleDto {
    type;
    clienteId;
    descripcionTrabajo;
    sucursalId;
    fechaProgramada;
    lugar;
    monto;
    adelanto;
    horario;
    vendedorId;
    tecnicoId;
    quotationId;
    observaciones;
    mapsLink;
    estado;
}
exports.CreateScheduleDto = CreateScheduleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['seguridad', 'proyectos'] }),
    (0, class_validator_1.IsIn)(['seguridad', 'proyectos']),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "descripcionTrabajo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ISO datetime or date' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "fechaProgramada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "lugar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateScheduleDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateScheduleDto.prototype, "adelanto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "horario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "vendedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "quotationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "observaciones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "mapsLink", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['programado', 'en_proceso', 'terminado', 'cancelado'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['programado', 'en_proceso', 'terminado', 'cancelado']),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "estado", void 0);
class UpdateScheduleDto {
    lugar;
    descripcionTrabajo;
    monto;
    adelanto;
    fechaProgramada;
    horario;
    vendedorId;
    tecnicoId;
    observaciones;
    mapsLink;
    estado;
    fechaFinalizacion;
}
exports.UpdateScheduleDto = UpdateScheduleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "lugar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "descripcionTrabajo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateScheduleDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateScheduleDto.prototype, "adelanto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "fechaProgramada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "horario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "vendedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "observaciones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "mapsLink", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['programado', 'en_proceso', 'terminado', 'cancelado'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['programado', 'en_proceso', 'terminado', 'cancelado']),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "fechaFinalizacion", void 0);
class ScheduleStatusDto {
    estado;
    fechaFinalizacion;
}
exports.ScheduleStatusDto = ScheduleStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['programado', 'en_proceso', 'terminado', 'cancelado'] }),
    (0, class_validator_1.IsIn)(['programado', 'en_proceso', 'terminado', 'cancelado']),
    __metadata("design:type", String)
], ScheduleStatusDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], ScheduleStatusDto.prototype, "fechaFinalizacion", void 0);
//# sourceMappingURL=schedule.dto.js.map