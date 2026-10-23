import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../../common/auth/current-user.decorator';
import { CreateMovementDto, ListMovementsQuery, ReasonDto, UpdateMovementDto, ValidateMovementDto } from './dto/finance.dto';
import { LedgerService } from './ledger.service';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(AuthGuard)
export class FinanceController {
  constructor(private readonly ledger: LedgerService) {}

  @Get('movements')
  @ApiOperation({ summary: 'Ledger (commercial roles see all, técnico his own)' })
  list(@Query() query: ListMovementsQuery, @CurrentUser() user: User) {
    return this.ledger.list(query, user);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Register an expense, another income or a transfer (project/job payments go through them)' })
  create(@Body() dto: CreateMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.create(dto, user, sessionId);
  }

  @Patch('movements/:id')
  @ApiOperation({ summary: 'Correct a movement not yet validated (an observed one returns to validation)' })
  update(@Param('id') id: string, @Body() dto: UpdateMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.update(id, dto, user, sessionId);
  }

  @Post('movements/:id/validar')
  @ApiOperation({ summary: 'Validate into a cash box (Gerencia)' })
  validate(@Param('id') id: string, @Body() dto: ValidateMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.transition(id, 'validado', { cajaId: dto.cajaId }, user, sessionId);
  }

  @Post('movements/:id/observar')
  @ApiOperation({ summary: 'Send back with a reason (Gerencia)' })
  observe(@Param('id') id: string, @Body() dto: ReasonDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.transition(id, 'observado', { motivo: dto.motivo }, user, sessionId);
  }

  @Post('movements/:id/anular')
  @ApiOperation({ summary: 'Cancel a movement not validated, with a reason' })
  cancel(@Param('id') id: string, @Body() dto: ReasonDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.transition(id, 'anulado', { motivo: dto.motivo }, user, sessionId);
  }

  @Post('movements/:id/revertir')
  @ApiOperation({ summary: 'Reverse a validated movement with its opposite (Gerencia)' })
  reverse(@Param('id') id: string, @Body() dto: ReasonDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.reverse(id, dto.motivo, user, sessionId);
  }

  @Post('movements/:id/reembolsar')
  @ApiOperation({ summary: 'Mark an employee expense as refunded (Gerencia)' })
  refund(@Param('id') id: string, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.refund(id, user, sessionId);
  }

  @Get('cajas')
  @ApiOperation({ summary: 'Cash boxes with their validated balance' })
  cashBoxes(@CurrentUser() user: User) {
    return this.ledger.cashBoxes(user);
  }
}
