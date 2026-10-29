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
exports.ListDirectSalesQuery = exports.AnnulDirectSaleDto = exports.CreateDirectSaleDto = exports.DirectSalePaymentDto = exports.DirectSaleLineDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const direct_sales_rules_1 = require("../domain/direct-sales.rules");
class DirectSaleLineDto {
    productoId;
    cantidad;
    precioUnitario;
    descuento;
}
exports.DirectSaleLineDto = DirectSaleLineDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DirectSaleLineDto.prototype, "productoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'La cantidad debe ser mayor a 0' }),
    __metadata("design:type", Number)
], DirectSaleLineDto.prototype, "cantidad", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DirectSaleLineDto.prototype, "precioUnitario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DirectSaleLineDto.prototype, "descuento", void 0);
class DirectSalePaymentDto {
    medio;
    monto;
}
exports.DirectSalePaymentDto = DirectSalePaymentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: direct_sales_rules_1.PAYMENT_METHODS }),
    (0, class_validator_1.IsIn)(direct_sales_rules_1.PAYMENT_METHODS, { message: 'Medio de pago no válido' }),
    __metadata("design:type", String)
], DirectSalePaymentDto.prototype, "medio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'Cada pago debe ser mayor a 0' }),
    __metadata("design:type", Number)
], DirectSalePaymentDto.prototype, "monto", void 0);
class CreateDirectSaleDto {
    sucursalId;
    clienteId;
    clienteNombre;
    clienteCelular;
    clienteNit;
    items;
    descuento;
    pagos;
    reemplazaAId;
}
exports.CreateDirectSaleDto = CreateDirectSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch the stock leaves from' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Indica la sucursal de la que sale el stock' }),
    __metadata("design:type", String)
], CreateDirectSaleDto.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDirectSaleDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'As printed on the note; "Cliente varios" when empty' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateDirectSaleDto.prototype, "clienteNombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], CreateDirectSaleDto.prototype, "clienteCelular", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Razón social / NIT' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateDirectSaleDto.prototype, "clienteNit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DirectSaleLineDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Agrega al menos un producto' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DirectSaleLineDto),
    __metadata("design:type", Array)
], CreateDirectSaleDto.prototype, "items", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0, description: 'Discount on the whole sale' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateDirectSaleDto.prototype, "descuento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [DirectSalePaymentDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => DirectSalePaymentDto),
    __metadata("design:type", Array)
], CreateDirectSaleDto.prototype, "pagos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: '"Corregir": the annulled sale this one replaces' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDirectSaleDto.prototype, "reemplazaAId", void 0);
class AnnulDirectSaleDto {
    motivo;
}
exports.AnnulDirectSaleDto = AnnulDirectSaleDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Indica el motivo de la anulación' }),
    __metadata("design:type", String)
], AnnulDirectSaleDto.prototype, "motivo", void 0);
class ListDirectSalesQuery {
    sucursalId;
    vendedorId;
    estado;
    desde;
    hasta;
}
exports.ListDirectSalesQuery = ListDirectSalesQuery;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListDirectSalesQuery.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListDirectSalesQuery.prototype, "vendedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['registrada', 'anulada'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['registrada', 'anulada']),
    __metadata("design:type", String)
], ListDirectSalesQuery.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bolivian day (inclusive)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListDirectSalesQuery.prototype, "desde", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bolivian day (inclusive)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListDirectSalesQuery.prototype, "hasta", void 0);
//# sourceMappingURL=direct-sale.dto.js.map