import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const SOLICITUD_ESTADOS = ['nueva', 'contactada', 'convertida', 'descartada'] as const;

/** Payload sent by the hstecnologias.com form (same fields and limits as the form). */
export class WebhookSolicitudDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  nombre: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  empresa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  departamento?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  servicio?: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(3000)
  detalle: string;

  @ApiPropertyOptional({ description: 'URL de la página desde donde se envió' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pagina?: string;
}

export class UpdateSolicitudDto {
  @ApiPropertyOptional({ enum: ['nueva', 'contactada', 'descartada'] })
  @IsOptional()
  @IsIn(['nueva', 'contactada', 'descartada'])
  estado?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  notas?: string;
}
