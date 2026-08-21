import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { UpsertRelevamientoDto } from './dto/relevamiento.dto';
import { RelevamientosService } from './relevamientos.service';

@ApiTags('relevamientos')
@ApiBearerAuth()
@Controller('relevamientos')
@UseGuards(AuthGuard)
export class RelevamientosController {
  constructor(private readonly relevamientos: RelevamientosService) {}

  @Get()
  @ApiOperation({ summary: 'List relevamientos' })
  list(@CurrentUser() user: User, @Query('cotizacionId') cotizacionId?: string) {
    return this.relevamientos.list(user, cotizacionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get relevamiento by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.relevamientos.get(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create relevamiento' })
  create(@Body() dto: UpsertRelevamientoDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.relevamientos.create(dto, user, sessionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update relevamiento' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<UpsertRelevamientoDto>,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.relevamientos.update(id, dto, user, sessionId);
  }
}
