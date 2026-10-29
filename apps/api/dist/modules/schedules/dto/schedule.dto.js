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
exports.CreateSchedulePaymentDto = exports.ScheduleStatusDto = exports.UpdateScheduleDto = exports.CreateScheduleDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const emptyToUndef = ({ value }) => (value === '' || value === null ? undefined : value);
const clearable = ({ value }) => (value === null ? '' : value);
class CreateScheduleDto {
    categoriaId;
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'One of the 3 divisions; taken from the quotation when quotationId is set' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateScheduleDto.prototype, "categoriaId", void 0);
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
    categoriaId;
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'One of the 3 divisions (not for jobs that come from a quotation)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "categoriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
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
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "horario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "vendedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateScheduleDto.prototype, "observaciones", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
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
class CreateSchedulePaymentDto {
    tipo;
    monto;
    metodo;
    nota;
    relevamientoId;
    quotationId;
    recibidoPorId;
    cuentaDestino;
}
exports.CreateSchedulePaymentDto = CreateSchedulePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['adelanto', 'cobro', 'extra_asistencia'], description: 'extra_asistencia = adicional (does not reduce the balance)' }),
    (0, class_validator_1.IsIn)(['adelanto', 'cobro', 'extra_asistencia'], { message: 'Tipo de cobro no válido' }),
    __metadata("design:type", String)
], CreateSchedulePaymentDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateSchedulePaymentDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateSchedulePaymentDto.prototype, "metodo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateSchedulePaymentDto.prototype, "nota", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateSchedulePaymentDto.prototype, "relevamientoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateSchedulePaymentDto.prototype, "quotationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Who received the money (default: who registers it)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateSchedulePaymentDto.prototype, "recibidoPorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['qr_empresa', 'qr_socia', 'qr_personal'], description: 'QR payments only: which QR it reached (LAUNCH P1-1)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['qr_empresa', 'qr_socia', 'qr_personal'], { message: 'Cuenta destino no válida' }),
    __metadata("design:type", String)
], CreateSchedulePaymentDto.prototype, "cuentaDestino", void 0);
//# sourceMappingURL=schedule.dto.js.map