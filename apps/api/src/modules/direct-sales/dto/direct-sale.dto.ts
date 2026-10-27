import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { PAYMENT_METHODS } from '../domain/direct-sales.rules';

export class DirectSaleLineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  productoId: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  descuento?: number;
}

export class DirectSalePaymentDto {
  @ApiProperty({ enum: PAYMENT_METHODS })
  @IsIn(PAYMENT_METHODS, { message: 'Medio de pago no válido' })
  medio: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Cada pago debe ser mayor a 0' })
  monto: number;
}

export class CreateDirectSaleDto {
  @ApiProperty({ description: 'Branch the stock leaves from' })
  @IsString()
  @IsNotEmpty({ message: 'Indica la sucursal de la que sale el stock' })
  sucursalId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clienteId?: string;

  @ApiPropertyOptional({ description: 'As printed on the note; "Cliente varios" when empty' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  clienteNombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  clienteCelular?: string;

  @ApiPropertyOptional({ description: 'Razón social / NIT' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clienteNit?: string;

  @ApiProperty({ type: [DirectSaleLineDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => DirectSaleLineDto)
  items: DirectSaleLineDto[];

  @ApiPropertyOptional({ minimum: 0, description: 'Discount on the whole sale' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  descuento?: number;

  @ApiProperty({ type: [DirectSalePaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DirectSalePaymentDto)
  pagos: DirectSalePaymentDto[];

  @ApiPropertyOptional({ description: '"Corregir": the annulled sale this one replaces' })
  @IsOptional()
  @IsString()
  reemplazaAId?: string;
}

export class AnnulDirectSaleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo de la anulación' })
  motivo: string;
}

export class ListDirectSalesQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vendedorId?: string;

  @ApiPropertyOptional({ enum: ['registrada', 'anulada'] })
  @IsOptional()
  @IsIn(['registrada', 'anulada'])
  estado?: string;

  @ApiPropertyOptional({ description: 'Bolivian day (inclusive)' })
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional({ description: 'Bolivian day (inclusive)' })
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
