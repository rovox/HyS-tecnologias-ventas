import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  titulo: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  asignadoId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  monto?: number;
}

export class JobStatusDto {
  @ApiProperty()
  @IsString()
  estado: string;
}

export class CreatePaymentDto {
  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  monto: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metodo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;
}
