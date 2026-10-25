import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';

const emptyToUndef = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);
/** On update, '' (or null) clears the field: "Sin asignar", no place, no link. */
const clearable = ({ value }: { value: unknown }) => (value === null ? '' : value);

export class CreateScheduleDto {
  @ApiPropertyOptional({ description: 'One of the 3 divisions; taken from the quotation when quotationId is set' })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiProperty()
  @IsString()
  clienteId: string;

  @ApiProperty()
  @IsString()
  descripcionTrabajo: string;

  @ApiProperty()
  @IsString()
  sucursalId: string;

  @ApiProperty({ description: 'ISO datetime or date' })
  @IsDateString()
  fechaProgramada: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  lugar?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adelanto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  horario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  vendedorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  tecnicoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  quotationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  mapsLink?: string;

  @ApiPropertyOptional({ enum: ['programado', 'en_proceso', 'terminado', 'cancelado'] })
  @IsOptional()
  @IsIn(['programado', 'en_proceso', 'terminado', 'cancelado'])
  estado?: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'One of the 3 divisions (not for jobs that come from a quotation)' })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  lugar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  descripcionTrabajo?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  adelanto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fechaProgramada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  horario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  vendedorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  tecnicoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  observaciones?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  mapsLink?: string;

  @ApiPropertyOptional({ enum: ['programado', 'en_proceso', 'terminado', 'cancelado'] })
  @IsOptional()
  @IsIn(['programado', 'en_proceso', 'terminado', 'cancelado'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fechaFinalizacion?: string;
}

export class ScheduleStatusDto {
  @ApiProperty({ enum: ['programado', 'en_proceso', 'terminado', 'cancelado'] })
  @IsIn(['programado', 'en_proceso', 'terminado', 'cancelado'])
  estado: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fechaFinalizacion?: string;
}

export class CreateSchedulePaymentDto {
  @ApiProperty({ enum: ['adelanto', 'cobro', 'extra_asistencia'], description: 'extra_asistencia = adicional (does not reduce the balance)' })
  @IsIn(['adelanto', 'cobro', 'extra_asistencia'], { message: 'Tipo de cobro no válido' })
  tipo: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  metodo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  nota?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  relevamientoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  quotationId?: string;

  @ApiPropertyOptional({ description: 'Who received the money (default: who registers it)' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  recibidoPorId?: string;
}
