import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CashCloseQuery {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Indica la sucursal' })
  sucursalId: string;

  @ApiProperty({ description: 'Bolivian day YYYY-MM-DD' })
  @IsDateString()
  dia: string;
}

export class CloseCashDto extends CashCloseQuery {
  @ApiProperty({ description: '{ "200": 3, "100": 5, …, "0.1": 4 } — how many of each note and coin' })
  @IsObject()
  conteo: Record<string, number>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motivoDiferencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class ListCashClosesQuery {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sucursalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  desde?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  hasta?: string;
}
