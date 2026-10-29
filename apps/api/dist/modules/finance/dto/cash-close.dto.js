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
exports.ListCashClosesQuery = exports.CloseCashDto = exports.CashCloseQuery = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CashCloseQuery {
    sucursalId;
    dia;
}
exports.CashCloseQuery = CashCloseQuery;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Indica la sucursal' }),
    __metadata("design:type", String)
], CashCloseQuery.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Bolivian day YYYY-MM-DD' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CashCloseQuery.prototype, "dia", void 0);
class CloseCashDto extends CashCloseQuery {
    conteo;
    motivoDiferencia;
    observaciones;
}
exports.CloseCashDto = CloseCashDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '{ "200": 3, "100": 5, …, "0.1": 4 } — how many of each note and coin' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CloseCashDto.prototype, "conteo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CloseCashDto.prototype, "motivoDiferencia", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CloseCashDto.prototype, "observaciones", void 0);
class ListCashClosesQuery {
    sucursalId;
    desde;
    hasta;
}
exports.ListCashClosesQuery = ListCashClosesQuery;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListCashClosesQuery.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListCashClosesQuery.prototype, "desde", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListCashClosesQuery.prototype, "hasta", void 0);
//# sourceMappingURL=cash-close.dto.js.map