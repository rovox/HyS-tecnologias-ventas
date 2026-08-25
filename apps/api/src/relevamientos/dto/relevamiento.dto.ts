import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpsertRelevamientoDto {
  @ApiProperty()
  @IsString()
  cotizacionId: string;

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
