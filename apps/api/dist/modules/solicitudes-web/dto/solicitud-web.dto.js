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
exports.UpdateSolicitudDto = exports.WebhookSolicitudDto = exports.SOLICITUD_ESTADOS = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
exports.SOLICITUD_ESTADOS = ['nueva', 'contactada', 'convertida', 'descartada'];
class WebhookSolicitudDto {
    nombre;
    empresa;
    email;
    telefono;
    departamento;
    servicio;
    detalle;
    pagina;
}
exports.WebhookSolicitudDto = WebhookSolicitudDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "empresa", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "telefono", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "departamento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "servicio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(3000),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "detalle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'URL de la página desde donde se envió' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], WebhookSolicitudDto.prototype, "pagina", void 0);
class UpdateSolicitudDto {
    estado;
    notas;
}
exports.UpdateSolicitudDto = UpdateSolicitudDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['nueva', 'contactada', 'descartada'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['nueva', 'contactada', 'descartada']),
    __metadata("design:type", String)
], UpdateSolicitudDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(3000),
    __metadata("design:type", String)
], UpdateSolicitudDto.prototype, "notas", void 0);
//# sourceMappingURL=solicitud-web.dto.js.map