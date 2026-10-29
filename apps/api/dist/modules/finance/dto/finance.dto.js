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
exports.IncomeDto = exports.ExportMovementsQuery = exports.ListMovementsQuery = exports.ReasonDto = exports.ValidateMovementDto = exports.ImpactQuery = exports.UpdateMovementDto = exports.SettleAdvanceDto = exports.CreateMovementDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const finance_rules_1 = require("../domain/finance.rules");
const emptyToUndef = ({ value }) => (value === '' || value === null ? undefined : value);
class CreateMovementDto {
    tipo;
    concepto;
    monto;
    fecha;
    metodo;
    nota;
    projectId;
    cajaId;
    cajaDestinoId;
    pagadoPor;
    sucursalId;
    responsableId;
    asunto;
    fechaLimite;
}
exports.CreateMovementDto = CreateMovementDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: finance_rules_1.MOVEMENT_TIPOS }),
    (0, class_validator_1.IsIn)(finance_rules_1.MOVEMENT_TIPOS, { message: 'Tipo de movimiento no válido' }),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'See CONCEPTOS in finance.rules.ts' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "concepto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], CreateMovementDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO date; today when omitted' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "fecha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "metodo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "nota", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Expense of a project (part of its cost)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Transfers: origin box' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "cajaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Transfers: destination box' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "cajaDestinoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['empresa', 'empleado'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['empresa', 'empleado']),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "pagadoPor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "sucursalId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Anticipo por rendir: who receives the fund' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "responsableId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Anticipo por rendir: what it is for' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "asunto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Anticipo por rendir: day it must be accounted for' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateMovementDto.prototype, "fechaLimite", void 0);
class SettleAdvanceDto {
    nota;
}
exports.SettleAdvanceDto = SettleAdvanceDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'How it was accounted for (receipts, what was returned)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SettleAdvanceDto.prototype, "nota", void 0);
class UpdateMovementDto {
    concepto;
    monto;
    fecha;
    metodo;
    nota;
    pagadoPor;
    recibidoPorId;
    cajaId;
}
exports.UpdateMovementDto = UpdateMovementDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMovementDto.prototype, "concepto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ minimum: 0.01 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], UpdateMovementDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateMovementDto.prototype, "fecha", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMovementDto.prototype, "metodo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateMovementDto.prototype, "nota", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['empresa', 'empleado'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['empresa', 'empleado']),
    __metadata("design:type", String)
], UpdateMovementDto.prototype, "pagadoPor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Incomes: who received the money (Gerencia or Contabilidad, or the author while it waits)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateMovementDto.prototype, "recibidoPorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Validated movements: the box where the money is (Gerencia or Contabilidad)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], UpdateMovementDto.prototype, "cajaId", void 0);
class ImpactQuery {
    accion;
    cajaId;
}
exports.ImpactQuery = ImpactQuery;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['validar', 'anular'] }),
    (0, class_validator_1.IsIn)(['validar', 'anular']),
    __metadata("design:type", String)
], ImpactQuery.prototype, "accion", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'validar: the box chosen' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ImpactQuery.prototype, "cajaId", void 0);
class ValidateMovementDto {
    cajaId;
}
exports.ValidateMovementDto = ValidateMovementDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Box where the money stays (not for transfers)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], ValidateMovementDto.prototype, "cajaId", void 0);
class ReasonDto {
    motivo;
}
exports.ReasonDto = ReasonDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Indica el motivo' }),
    __metadata("design:type", String)
], ReasonDto.prototype, "motivo", void 0);
class ListMovementsQuery {
    tipo;
    estado;
    cajaId;
    projectId;
    clienteId;
    desde;
    hasta;
    sucursalId;
}
exports.ListMovementsQuery = ListMovementsQuery;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: finance_rules_1.MOVEMENT_TIPOS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(finance_rules_1.MOVEMENT_TIPOS),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: finance_rules_1.MOVEMENT_ESTADOS }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(finance_rules_1.MOVEMENT_ESTADOS),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "cajaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "projectId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO date (inclusive)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "desde", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ISO date (inclusive)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "hasta", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only this branch (without it: the whole company)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ListMovementsQuery.prototype, "sucursalId", void 0);
class ExportMovementsQuery extends ListMovementsQuery {
    formato;
}
exports.ExportMovementsQuery = ExportMovementsQuery;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['csv', 'xlsx'] }),
    (0, class_validator_1.IsIn)(['csv', 'xlsx'], { message: 'Formato no válido: csv o xlsx' }),
    __metadata("design:type", String)
], ExportMovementsQuery.prototype, "formato", void 0);
class IncomeDto {
    concepto;
    monto;
    metodo;
    nota;
    recibidoPorId;
    cuentaDestino;
}
exports.IncomeDto = IncomeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['adelanto', 'cobro', 'adicional', 'asistencia'], description: 'asistencia: only on a visit' }),
    (0, class_validator_1.IsIn)(['adelanto', 'cobro', 'adicional', 'asistencia'], { message: 'Tipo de cobro no válido' }),
    __metadata("design:type", String)
], IncomeDto.prototype, "concepto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minimum: 0.01 }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01, { message: 'El monto debe ser mayor a 0' }),
    __metadata("design:type", Number)
], IncomeDto.prototype, "monto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IncomeDto.prototype, "metodo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IncomeDto.prototype, "nota", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Who received the money (default: who registers it)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], IncomeDto.prototype, "recibidoPorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['qr_empresa', 'qr_socia', 'qr_personal'], description: 'QR payments only: which QR it reached' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['qr_empresa', 'qr_socia', 'qr_personal'], { message: 'Cuenta destino no válida' }),
    (0, class_transformer_1.Transform)(emptyToUndef),
    __metadata("design:type", String)
], IncomeDto.prototype, "cuentaDestino", void 0);
//# sourceMappingURL=finance.dto.js.map