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
exports.UpsertRelevamientoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class UpsertRelevamientoDto {
    cotizacionId;
    fecha;
    fechaFin;
    tipoVisita;
    vendedorId;
    tecnicoId;
    lugar;
    notas;
    fotosUrl;
}
exports.UpsertRelevamientoDto = UpsertRelevamientoDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "cotizacionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2026-08-21', description: 'Fecha de atención (inicio)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "fecha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: '2026-08-22', description: 'Fecha de finalización' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "fechaFin", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['relevamiento', 'asistencia'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['relevamiento', 'asistencia']),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "tipoVisita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "vendedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "tecnicoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "lugar", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpsertRelevamientoDto.prototype, "notas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'JSON/array of photo URLs' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], UpsertRelevamientoDto.prototype, "fotosUrl", void 0);
//# sourceMappingURL=relevamiento.dto.js.map