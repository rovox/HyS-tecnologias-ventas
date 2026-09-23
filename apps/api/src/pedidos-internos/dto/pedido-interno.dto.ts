import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PedidoItemDto {
  @ApiProperty()
  @IsString()
  materialNombre: string;

  @ApiProperty()
  @IsNumber()
  cantidad: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  costoUnitario?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class UpsertPedidoInternoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsableId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalOrigenId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalDestinoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cronogramaId?: string;

  @ApiPropertyOptional({ enum: ['Baja', 'Normal', 'Alta', 'Urgente'] })
  @IsOptional()
  @IsIn(['Baja', 'Normal', 'Alta', 'Urgente'])
  prioridad?: string;

  @ApiPropertyOptional({ enum: ['solicitado', 'aprobado', 'en_preparación', 'entregado', 'cancelado'] })
  @IsOptional()
  @IsIn(['solicitado', 'aprobado', 'en_preparación', 'entregado', 'cancelado'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fechaEntregaEstimada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;

  @ApiPropertyOptional({ type: [PedidoItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PedidoItemDto)
  items?: PedidoItemDto[];
}

export class UpdateEstadoPedidoDto {
  @ApiProperty()
  @IsIn(['solicitado', 'aprobado', 'en_preparación', 'entregado', 'cancelado'])
  estado: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fecha_entrega?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  entregado_por_id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacion?: string;
}

export class AddComentarioDto {
  @ApiProperty()
  @IsString()
  contenido: string;
}
