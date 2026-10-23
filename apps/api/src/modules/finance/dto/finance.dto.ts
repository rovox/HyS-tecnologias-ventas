import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { MOVEMENT_ESTADOS, MOVEMENT_TIPOS } from '../domain/finance.rules';

const emptyToUndef = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);

export class CreateMovementDto {
  @ApiProperty({ enum: MOVEMENT_TIPOS })
  @IsIn(MOVEMENT_TIPOS, { message: 'Tipo de movimiento no válido' })
  tipo: string;

  @ApiProperty({ description: 'See CONCEPTOS in finance.rules.ts' })
  @IsString()
  concepto: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiPropertyOptional({ description: 'ISO date; today when omitted' })
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fecha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metodo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;

  @ApiPropertyOptional({ description: 'Expense of a project (part of its cost)' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  projectId?: string;

  @ApiPropertyOptional({ description: 'Transfers: origin box' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  cajaId?: string;

  @ApiPropertyOptional({ description: 'Transfers: destination box' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  cajaDestinoId?: string;

  @ApiPropertyOptional({ enum: ['empresa', 'empleado'] })
  @IsOptional()
  @IsIn(['empresa', 'empleado'])
  pagadoPor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  sucursalId?: string;
}

export class UpdateMovementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  concepto?: string;

  @ApiPropertyOptional({ minimum: 0.01 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fecha?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metodo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;

  @ApiPropertyOptional({ enum: ['empresa', 'empleado'] })
  @IsOptional()
  @IsIn(['empresa', 'empleado'])
  pagadoPor?: string;
}

export class ValidateMovementDto {
  @ApiPropertyOptional({ description: 'Box where the money stays (not for transfers)' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  cajaId?: string;
}

export class ReasonDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo' })
  motivo: string;
}

export class ListMovementsQuery {
  @ApiPropertyOptional({ enum: MOVEMENT_TIPOS })
  @IsOptional()
  @IsIn(MOVEMENT_TIPOS)
  tipo?: string;

  @ApiPropertyOptional({ enum: MOVEMENT_ESTADOS })
  @IsOptional()
  @IsIn(MOVEMENT_ESTADOS)
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cajaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'ISO date (inclusive)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}

/** A payment of a project or job: advance, payment against the balance, or an additional charge on top. */
export class IncomeDto {
  @ApiProperty({ enum: ['adelanto', 'cobro', 'adicional'] })
  @IsIn(['adelanto', 'cobro', 'adicional'], { message: 'Tipo de cobro no válido' })
  concepto: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metodo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;
}
