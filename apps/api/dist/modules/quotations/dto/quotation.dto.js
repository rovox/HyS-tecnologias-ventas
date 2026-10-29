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
exports.AcceptQuotationDto = exports.ListQuotationsQuery = exports.DeleteQuotationDto = exports.StatusDto = exports.UpdateQuotationDto = exports.CreateQuotationDto = exports.VendorDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const emptyToUndef = ({ value }) => (value === '' || value === null ? undefined : value);
const clearable = ({ value }) => (value === null ? '' : value);
class VendorDto {
    userId;
    nombre;
    commissionPct;
}
exports.VendorDto = VendorDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VendorDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], VendorDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], VendorDto.prototype, "commissionPct", void 0);
class CreateQuotationDto {
    tareaId;
    titulo;
    clienteId;
    categoriaId;
    subcategoria;
    sucursalId;
    sucursalNombre;
    monto;
    observacion;
    archivo;
    vendedores;
    tieneLicitacion;
    licitacionNumero;
    licitacionEntidad;
    plazoFinal;
}
exports.CreateQuotationDto = CreateQuotationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Task this quotation comes from: it is linked and completed' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "tareaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'One of the 3 divisions (GET /categories, principal = true)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Selecciona la categoría' }),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "categoriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "subcategoria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "sucursalNombre", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], CreateQuotationDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "observacion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "archivo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [VendorDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => VendorDto),
    __metadata("design:type", Array)
], CreateQuotationDto.prototype, "vendedores", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateQuotationDto.prototype, "tieneLicitacion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "licitacionNumero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "licitacionEntidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateQuotationDto.prototype, "plazoFinal", void 0);
class UpdateQuotationDto {
    titulo;
    categoriaId;
    subcategoria;
    monto;
    clienteId;
    fechaEnvio;
    observacion;
    vendedores;
    tieneLicitacion;
    licitacionNumero;
    licitacionEntidad;
    plazoFinal;
}
exports.UpdateQuotationDto = UpdateQuotationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'One of the 3 divisions' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "categoriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "subcategoria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0.01 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], UpdateQuotationDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "fechaEnvio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "observacion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [VendorDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => VendorDto),
    __metadata("design:type", Array)
], UpdateQuotationDto.prototype, "vendedores", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateQuotationDto.prototype, "tieneLicitacion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "licitacionNumero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "licitacionEntidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_, v) => v !== ''),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(clearable),
    __metadata("design:type", String)
], UpdateQuotationDto.prototype, "plazoFinal", void 0);
class StatusDto {
    estado;
    motivoRechazo;
    fechaEnvio;
}
exports.StatusDto = StatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['borrador', 'enviado', 'aprobado', 'rechazado'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['borrador', 'enviado', 'aprobado', 'rechazado']),
    __metadata("design:type", String)
], StatusDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StatusDto.prototype, "motivoRechazo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], StatusDto.prototype, "fechaEnvio", void 0);
class DeleteQuotationDto {
    motivo;
}
exports.DeleteQuotationDto = DeleteQuotationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Why it is deleted (kept in the record)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Indica el motivo de la eliminación' }),
    __metadata("design:type", String)
], DeleteQuotationDto.prototype, "motivo", void 0);
class ListQuotationsQuery {
    vista;
    estado;
    categoriaId;
    vendedorId;
    sucursalId;
    clienteId;
    q;
}
exports.ListQuotationsQuery = ListQuotationsQuery;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['abiertas', 'cerradas'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['abiertas', 'cerradas']),
    __metadata("design:type", String)
], ListQuotationsQuery.prototype, "vista", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListQuotationsQuery.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListQuotationsQuery.prototype, "categoriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListQuotationsQuery.prototype, "vendedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListQuotationsQuery.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListQuotationsQuery.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number, title or client name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListQuotationsQuery.prototype, "q", void 0);
class AcceptQuotationDto {
    fechaProgramada;
    lugar;
    tecnicoId;
    horario;
}
exports.AcceptQuotationDto = AcceptQuotationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO date; today when omitted' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], AcceptQuotationDto.prototype, "fechaProgramada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcceptQuotationDto.prototype, "lugar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], AcceptQuotationDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], AcceptQuotationDto.prototype, "horario", void 0);
//# sourceMappingURL=quotation.dto.js.map