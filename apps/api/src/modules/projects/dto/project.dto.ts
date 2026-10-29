import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PROJECT_ESTADOS } from '../domain/projects.rules';

const emptyToUndef = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);
// On updates an emptied field arrives as '' or null and must reach the service as '' (it saves null), not be dropped.
const clearable = ({ value }: { value: unknown }) => (value === null ? '' : value);

export class ListProjectsQuery {
  @ApiPropertyOptional({ enum: PROJECT_ESTADOS })
  @IsOptional()
  @IsIn(PROJECT_ESTADOS)
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clienteId?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  titulo?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 120 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  garantiaMeses?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(clearable)
  responsableId?: string;
}

export class ProjectStatusDto {
  @ApiProperty({ enum: PROJECT_ESTADOS })
  @IsIn(PROJECT_ESTADOS, { message: 'Estado de proyecto no válido' })
  estado: string;

  @ApiPropertyOptional({ description: 'Required to cancel (anulado)' })
  @IsOptional()
  @IsString()
  motivo?: string;
}

export class CreateProjectJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Describe el trabajo' })
  descripcionTrabajo: string;

  @ApiProperty({ description: 'ISO date' })
  @IsDateString()
  fechaProgramada: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  horario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  tecnicoId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Transform(emptyToUndef)
  lugar?: string;
}

export class ProjectAmountDto {
  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  montoOficial: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'Indica el motivo del cambio de monto' })
  motivo: string;
}

/** A payment of the project: advance, payment against the balance, or an additional charge on top (adicional). */
export class ProjectPaymentDto {
  @ApiProperty({ enum: ['adelanto', 'cobro', 'adicional'] })
  @IsIn(['adelanto', 'cobro', 'adicional'], { message: 'Tipo de cobro no válido' })
  concepto: string;

  @ApiProperty({ minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metodo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nota?: string;

  @ApiPropertyOptional({ description: 'Who received the money (default: who registers it)' })
  @IsOptional()
  @IsString()
  recibidoPorId?: string;
}
