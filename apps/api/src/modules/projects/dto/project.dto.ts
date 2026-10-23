import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PROJECT_ESTADOS } from '../domain/projects.rules';

const emptyToUndef = ({ value }: { value: unknown }) => (value === '' || value === null ? undefined : value);

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
  @Transform(emptyToUndef)
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

/** Until the ledger (FIN-01): a payment of the project, booked on its main job. */
export class ProjectPaymentDto {
  @ApiProperty({ enum: ['adelanto', 'cobro', 'extra_asistencia'] })
  @IsIn(['adelanto', 'cobro', 'extra_asistencia'], { message: 'Tipo de cobro no válido' })
  tipo: string;

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
}
