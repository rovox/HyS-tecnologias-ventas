import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

const emptyToUndef = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);

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
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  clienteId?: string;

  @ApiProperty({ description: 'One of the 3 divisions (GET /categories, principal = true)' })
  @IsString()
  @IsNotEmpty({ message: 'Selecciona la categoría' })
  categoriaId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategoria?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalNombre?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;

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

  @ApiPropertyOptional({ type: [VendorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorDto)
  vendedores?: VendorDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tieneLicitacion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  licitacionNumero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  licitacionEntidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  plazoFinal?: string;
}

export class UpdateQuotationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({ description: 'One of the 3 divisions' })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategoria?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fechaEnvio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observacion?: string;

  @ApiPropertyOptional({ type: [VendorDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorDto)
  vendedores?: VendorDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  tieneLicitacion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  licitacionNumero?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  licitacionEntidad?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  plazoFinal?: string;
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fechaEnvio?: string;
}

/** Optional data for the project (schedule) created when the quotation is accepted. */
export class AcceptQuotationDto {
  @ApiPropertyOptional({ description: 'ISO date; today when omitted' })
  @IsOptional()
  @IsDateString()
  @Transform(emptyToUndef)
  fechaProgramada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lugar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  tecnicoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  horario?: string;
}
