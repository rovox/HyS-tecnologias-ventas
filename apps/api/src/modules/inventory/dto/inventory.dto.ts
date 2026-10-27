import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { PRODUCT_TIPOS, STOCK_TIPOS } from '../domain/inventory.rules';

const emptyToUndef = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Escribe el código' })
  codigo: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Escribe el nombre' })
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiProperty({ description: 'One of the 3 divisions' })
  @IsString()
  categoriaId: string;

  @ApiProperty({ enum: PRODUCT_TIPOS })
  @IsIn(PRODUCT_TIPOS, { message: 'Tipo de producto no válido' })
  tipo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidad?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMinimo?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  marca?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional({ enum: PRODUCT_TIPOS })
  @IsOptional()
  @IsIn(PRODUCT_TIPOS)
  tipo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidad?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costo?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precio?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  stockMinimo?: number;

  @ApiPropertyOptional({ description: 'false archives the product (it is never deleted)' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class StockMovementDto {
  @ApiProperty()
  @IsString()
  productoId: string;

  @ApiProperty({ enum: STOCK_TIPOS })
  @IsIn(STOCK_TIPOS, { message: 'Tipo de movimiento no válido' })
  tipo: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiPropertyOptional({ description: 'Entrada: purchase unit cost (updates the product cost)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costoUnitario?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  sucursalOrigenId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  sucursalDestinoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;
}

/** One line of a batch (INV-03): the product, how much and, for a purchase, its unit cost. */
export class StockBatchLineDto {
  @ApiProperty()
  @IsString()
  productoId: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiPropertyOptional({ description: 'Entrada: purchase unit cost (updates the product cost)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  costoUnitario?: number;
}

/** Several products moved the same way in one go (quick actions of Inventario): all lines or none. */
export class StockBatchDto {
  @ApiProperty({ enum: STOCK_TIPOS })
  @IsIn(STOCK_TIPOS, { message: 'Tipo de movimiento no válido' })
  tipo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  sucursalOrigenId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  sucursalDestinoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  projectId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;

  @ApiProperty({ type: [StockBatchLineDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => StockBatchLineDto)
  items: StockBatchLineDto[];
}

/** Filters of the history (INV-03). */
export class ListMovementsQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productoId?: string;

  @ApiPropertyOptional({ description: 'In or out of this branch' })
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiPropertyOptional({ description: 'Comma-separated types (entrada,transferencia,salida_venta_directa,…)' })
  @IsOptional()
  @IsString()
  tipos?: string;

  @ApiPropertyOptional({ description: 'Bolivian day (inclusive)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Bolivian day (inclusive)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
