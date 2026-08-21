import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpsertRelevamientoDto {
  @ApiProperty()
  @IsString()
  cotizacionId: string;

  @ApiProperty({ example: '2026-08-21' })
  @IsString()
  fecha: string;

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
