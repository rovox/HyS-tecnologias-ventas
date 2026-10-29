import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpsertGoalDto {
  @ApiProperty()
  @IsString()
  usuarioId: string;

  @ApiProperty({ example: '2026-08' })
  @IsString()
  month: string;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  metaMonto: number;

  /** Quotations per month; no screen edits it yet, so leaving it out keeps the stored value. */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  metaCotiz?: number;
}
