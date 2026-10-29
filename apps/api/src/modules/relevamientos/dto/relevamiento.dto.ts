import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

const emptyToUndef = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);
/** On update, '' (or null) clears the field. */
const clearable = ({ value }: { value: unknown }) => (value === null ? '' : value);

/** Fields of a visit that both create and update take (state changes go through `/estado`). */
class VisitFieldsDto {
  @ApiPropertyOptional({ description: 'ID de sucursal (cuando no hay cotización)' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  sucursalId?: string;

  @ApiProperty({ example: '2026-08-21', description: 'Fecha de atención (inicio)' })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({ example: '2026-08-22', description: 'Fecha de finalización' })
  @IsOptional()
  @IsString()
  @Transform(clearable)
  fechaFin?: string;

  @ApiPropertyOptional({ example: '09:30' })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  @Transform(clearable)
  hora?: string;

  @ApiPropertyOptional({ enum: ['relevamiento', 'asistencia'] })
  @IsOptional()
  @IsIn(['relevamiento', 'asistencia'])
  tipoVisita?: string;

  @ApiPropertyOptional({ enum: ['baja', 'media', 'alta', 'urgente'] })
  @IsOptional()
  @IsIn(['baja', 'media', 'alta', 'urgente'])
  prioridad?: string;

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

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  lugar: string;

  @ApiPropertyOptional({ description: 'Link de ubicación de cualquier fuente (Maps, Waze, WhatsApp…)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(clearable)
  mapsLink?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  notas?: string;

  // Asistencia
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @Transform(clearable) motivo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) problemaReportado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @Transform(clearable) equipoAfectado?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) causaProbable?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) diagnostico?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) solucion?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiereMaterial?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiereVolver?: boolean;

  @ApiPropertyOptional({ description: 'Trabajo que la visita revisa (garantía)' })
  @IsOptional()
  @IsString()
  @Transform(clearable)
  trabajoRelacionadoId?: string;

  @ApiPropertyOptional({ description: 'Por defecto la del trabajo relacionado' })
  @IsOptional()
  @IsString()
  @Transform(clearable)
  garantiaHasta?: string;

  // Relevamiento
  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) necesidadCliente?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) @Transform(clearable) areaRevisar?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) medidasPuntos?: string;

  @ApiPropertyOptional({ description: 'Cámaras o puntos estimados' })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? null : value))
  @Type(() => Number)
  @IsInt()
  @Min(0)
  cantidadEstimada?: number | null;

  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) observacionTecnica?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() requiereCotizacion?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() @Transform(clearable) observacionFinal?: string;
}

export class CreateRelevamientoDto extends VisitFieldsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  cotizacionId?: string;

  @ApiPropertyOptional({ description: 'ID directo del cliente (cuando no hay cotización)' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  clienteId?: string;
}

export class UpdateRelevamientoDto extends PartialType(VisitFieldsDto) {}

export class VisitStatusDto {
  @ApiProperty({ enum: ['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'] })
  @IsIn(['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'], { message: 'Estado de visita no válido' })
  estado: string;

  @ApiPropertyOptional({ description: 'Obligatorio para cancelar' })
  @IsOptional()
  @IsString()
  motivo?: string;
}

/** A payment taken on a visit (asistencia): goes to the ledger as por validar. */
export class VisitPaymentDto {
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

  @ApiPropertyOptional({ description: 'Who received the money (default: who registers it)' })
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  recibidoPorId?: string;

  @ApiPropertyOptional({ enum: ['qr_empresa', 'qr_socia', 'qr_personal'], description: 'QR payments only: which QR it reached (LAUNCH P1-1)' })
  @IsOptional()
  @IsIn(['qr_empresa', 'qr_socia', 'qr_personal'], { message: 'Cuenta destino no válida' })
  cuentaDestino?: 'qr_empresa' | 'qr_socia' | 'qr_personal';
}
