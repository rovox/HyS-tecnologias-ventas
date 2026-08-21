import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

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

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  metaCotiz: number;
}
