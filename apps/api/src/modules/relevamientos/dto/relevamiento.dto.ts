import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpsertRelevamientoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cotizacionId?: string;

  @ApiPropertyOptional({ description: 'ID directo del cliente (cuando no hay cotización)' })
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'ID de sucursal (cuando no hay cotización)' })
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiProperty({ example: '2026-08-21', description: 'Fecha de atención (inicio)' })
  @IsString()
  fecha: string;

  @ApiPropertyOptional({ example: '2026-08-22', description: 'Fecha de finalización' })
  @IsOptional()
  @IsString()
  fechaFin?: string;

  @ApiPropertyOptional({ enum: ['relevamiento', 'asistencia'] })
  @IsOptional()
  @IsIn(['relevamiento', 'asistencia'])
  tipoVisita?: string;

  @ApiPropertyOptional({ enum: ['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'] })
  @IsOptional()
  @IsIn(['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'])
  estado?: string;

  @ApiPropertyOptional({ enum: ['baja', 'media', 'alta', 'urgente'] })
  @IsOptional()
  @IsIn(['baja', 'media', 'alta', 'urgente'])
  prioridad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendedorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tecnicoId?: string;

  @ApiProperty()
  @IsString()
  lugar: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiPropertyOptional({ description: 'JSON/array of photo URLs' })
  @IsOptional()
  fotosUrl?: unknown;
}
