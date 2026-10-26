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
exports.VisitPaymentDto = exports.VisitStatusDto = exports.UpdateRelevamientoDto = exports.CreateRelevamientoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const emptyToUndef = ({ value }) => (value === '' || value === null ? undefined : value);
const clearable = ({ value }) => (value === null ? '' : value);
class VisitFieldsDto {
    sucursalId;
    fecha;
    fechaFin;
    hora;
    tipoVisita;
    prioridad;
    vendedorId;
    tecnicoId;
    lugar;
    mapsLink;
    notas;
    motivo;
    problemaReportado;
    equipoAfectado;
    causaProbable;
    diagnostico;
    solucion;
    requiereMaterial;
    requiereVolver;
    trabajoRelacionadoId;
    garantiaHasta;
    necesidadCliente;
    areaRevisar;
    medidasPuntos;
    cantidadEstimada;
    observacionTecnica;
    requiereCotizacion;
    observacionFinal;
}
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID de sucursal (cuando no hay cotización)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-21', description: 'Fecha de atención (inicio)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "fecha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-22', description: 'Fecha de finalización' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "fechaFin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '09:30' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(16),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "hora", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['relevamiento', 'asistencia'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['relevamiento', 'asistencia']),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "tipoVisita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['baja', 'media', 'alta', 'urgente'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['baja', 'media', 'alta', 'urgente']),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "prioridad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "vendedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "lugar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Link de ubicación de cualquier fuente (Maps, Waze, WhatsApp…)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "mapsLink", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "notas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "motivo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "problemaReportado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "equipoAfectado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "causaProbable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "diagnostico", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "solucion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], VisitFieldsDto.prototype, "requiereMaterial", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], VisitFieldsDto.prototype, "requiereVolver", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Trabajo que la visita revisa (garantía)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "trabajoRelacionadoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Por defecto la del trabajo relacionado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "garantiaHasta", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "necesidadCliente", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "areaRevisar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "medidasPuntos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cámaras o puntos estimados' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value === '' || value === null ? null : value)),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], VisitFieldsDto.prototype, "cantidadEstimada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "observacionTecnica", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], VisitFieldsDto.prototype, "requiereCotizacion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], VisitFieldsDto.prototype, "observacionFinal", void 0);
class CreateRelevamientoDto extends VisitFieldsDto {
    cotizacionId;
    clienteId;
}
exports.CreateRelevamientoDto = CreateRelevamientoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateRelevamientoDto.prototype, "cotizacionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID directo del cliente (cuando no hay cotización)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateRelevamientoDto.prototype, "clienteId", void 0);
class UpdateRelevamientoDto extends (0, swagger_1.PartialType)(VisitFieldsDto) {
}
exports.UpdateRelevamientoDto = UpdateRelevamientoDto;
class VisitStatusDto {
    estado;
    motivo;
}
exports.VisitStatusDto = VisitStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'] }),
    (0, class_validator_1.IsIn)(['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'], { message: 'Estado de visita no válido' }),
    __metadata("design:type", String)
], VisitStatusDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Obligatorio para cancelar' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VisitStatusDto.prototype, "motivo", void 0);
class VisitPaymentDto {
    monto;
    metodo;
    nota;
    recibidoPorId;
}
exports.VisitPaymentDto = VisitPaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], VisitPaymentDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VisitPaymentDto.prototype, "metodo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VisitPaymentDto.prototype, "nota", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Who received the money (default: who registers it)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], VisitPaymentDto.prototype, "recibidoPorId", void 0);
//# sourceMappingURL=relevamiento.dto.js.map