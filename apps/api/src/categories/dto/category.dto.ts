import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Mantenimiento' })
  @IsString()
  @MinLength(2)
  label: string;

  @ApiPropertyOptional({ description: 'Optional slug id; generated from label if omitted' })
  @IsOptional()
  @IsString()
  id?: string;
}
