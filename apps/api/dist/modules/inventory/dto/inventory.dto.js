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
exports.ListMovementsQuery = exports.StockBatchDto = exports.StockBatchLineDto = exports.StockMovementDto = exports.UpdateProductDto = exports.CreateProductDto = exports.FirstEntryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const inventory_rules_1 = require("../domain/inventory.rules");
const emptyToUndef = ({ value }) => (value === '' || value === null ? undefined : value);
class FirstEntryDto {
    cantidad;
    costoUnitario;
    sucursalId;
    nota;
}
exports.FirstEntryDto = FirstEntryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'La cantidad de la primera entrada debe ser mayor a 0' }),
    __metadata("design:type", Number)
], FirstEntryDto.prototype, "cantidad", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'Indica el costo unitario de la primera entrada' }),
    __metadata("design:type", Number)
], FirstEntryDto.prototype, "costoUnitario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch the stock enters (a seller: Central)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Elige la sucursal' }),
    __metadata("design:type", String)
], FirstEntryDto.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Proveedor, factura…' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FirstEntryDto.prototype, "nota", void 0);
class CreateProductDto {
    codigo;
    nombre;
    marca;
    categoriaId;
    tipo;
    unidad;
    costo;
    precio;
    stockMinimo;
    stockInicial;
}
exports.CreateProductDto = CreateProductDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Escribe el código' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "codigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Escribe el nombre' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "marca", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'One of the 3 divisions' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "categoriaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: inventory_rules_1.PRODUCT_TIPOS }),
    (0, class_validator_1.IsIn)(inventory_rules_1.PRODUCT_TIPOS, { message: 'Tipo de producto no válido' }),
    __metadata("design:type", String)
], CreateProductDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProductDto.prototype, "unidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "costo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "precio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateProductDto.prototype, "stockMinimo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: FirstEntryDto, description: 'Required except for a service' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => FirstEntryDto),
    __metadata("design:type", FirstEntryDto)
], CreateProductDto.prototype, "stockInicial", void 0);
class UpdateProductDto {
    nombre;
    marca;
    categoriaId;
    tipo;
    unidad;
    costo;
    precio;
    stockMinimo;
    active;
}
exports.UpdateProductDto = UpdateProductDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "nombre", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "marca", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "categoriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: inventory_rules_1.PRODUCT_TIPOS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(inventory_rules_1.PRODUCT_TIPOS),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductDto.prototype, "unidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "costo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "precio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateProductDto.prototype, "stockMinimo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'false archives the product (it is never deleted)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProductDto.prototype, "active", void 0);
class StockMovementDto {
    productoId;
    tipo;
    cantidad;
    costoUnitario;
    sucursalOrigenId;
    sucursalDestinoId;
    projectId;
    motivo;
    nota;
}
exports.StockMovementDto = StockMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockMovementDto.prototype, "productoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: inventory_rules_1.STOCK_TIPOS }),
    (0, class_validator_1.IsIn)(inventory_rules_1.STOCK_TIPOS, { message: 'Tipo de movimiento no válido' }),
    __metadata("design:type", String)
], StockMovementDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'La cantidad debe ser mayor a 0' }),
    __metadata("design:type", Number)
], StockMovementDto.prototype, "cantidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Entrada: purchase unit cost (updates the product cost)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StockMovementDto.prototype, "costoUnitario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], StockMovementDto.prototype, "sucursalOrigenId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], StockMovementDto.prototype, "sucursalDestinoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], StockMovementDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockMovementDto.prototype, "motivo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockMovementDto.prototype, "nota", void 0);
class StockBatchLineDto {
    productoId;
    cantidad;
    costoUnitario;
}
exports.StockBatchLineDto = StockBatchLineDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockBatchLineDto.prototype, "productoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'La cantidad debe ser mayor a 0' }),
    __metadata("design:type", Number)
], StockBatchLineDto.prototype, "cantidad", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Entrada: purchase unit cost (updates the product cost)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], StockBatchLineDto.prototype, "costoUnitario", void 0);
class StockBatchDto {
    tipo;
    sucursalOrigenId;
    sucursalDestinoId;
    projectId;
    motivo;
    nota;
    items;
}
exports.StockBatchDto = StockBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: inventory_rules_1.STOCK_TIPOS }),
    (0, class_validator_1.IsIn)(inventory_rules_1.STOCK_TIPOS, { message: 'Tipo de movimiento no válido' }),
    __metadata("design:type", String)
], StockBatchDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], StockBatchDto.prototype, "sucursalOrigenId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], StockBatchDto.prototype, "sucursalDestinoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], StockBatchDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockBatchDto.prototype, "motivo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StockBatchDto.prototype, "nota", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StockBatchLineDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'Agrega al menos un producto' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StockBatchLineDto),
    __metadata("design:type", Array)
], StockBatchDto.prototype, "items", void 0);
class ListMovementsQuery {
    productoId;
    sucursalId;
    tipos;
    desde;
    hasta;
}
exports.ListMovementsQuery = ListMovementsQuery;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "productoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'In or out of this branch' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Comma-separated types (entrada,transferencia,salida_venta_directa,…)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "tipos", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bolivian day (inclusive)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "desde", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bolivian day (inclusive)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "hasta", void 0);
//# sourceMappingURL=inventory.dto.js.map