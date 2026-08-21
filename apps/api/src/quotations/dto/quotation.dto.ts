import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class VendorDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionPct?: number;
}

export class CreateQuotationDto {
  @ApiProperty()
  @IsString()
  titulo: string;

  @ApiProperty()
  @IsString()
  clienteId: string;

  @ApiProperty()
  @IsString()
  categoria: string;

  @ApiProperty()
  @IsString()
  categoriaId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategoria?: string;

  @ApiProperty()
  @IsString()
  sucursalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalNombre?: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  archivo?: string;

  @ApiPropertyOptional({ enum: ['borrador', 'enviado'] })
  @IsOptional()
  @IsIn(['borrador', 'enviado'])
  estado?: string;

  @ApiProperty({ type: [VendorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorDto)
  vendedores: VendorDto[];
}

export class StatusDto {
  @ApiProperty({ enum: ['borrador', 'enviado', 'aceptado', 'rechazado'] })
  @IsString()
  @IsIn(['borrador', 'enviado', 'aceptado', 'rechazado'])
  estado: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivoRechazo?: string;
}
