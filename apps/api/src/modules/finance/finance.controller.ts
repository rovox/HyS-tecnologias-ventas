import { Body, Controller, Get, Param, Patch, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../../common/auth/current-user.decorator';
import { CreateMovementDto, ExportMovementsQuery, ImpactQuery, ListMovementsQuery, ReasonDto, SettleAdvanceDto, UpdateMovementDto, ValidateMovementDto } from './dto/finance.dto';
import { LedgerService } from './ledger.service';
import { CashCloseService } from './cash-close.service';
import { CashCloseQuery, CloseCashDto, ListCashClosesQuery } from './dto/cash-close.dto';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
@UseGuards(AuthGuard)
export class FinanceController {
  constructor(
    private readonly ledger: LedgerService,
    private readonly cashClose: CashCloseService,
  ) {}

  @Get('cierres/preview')
  @ApiOperation({ summary: 'The day of a branch before counting: opening cash, cash movements, expected cash' })
  closePreview(@Query() query: CashCloseQuery, @CurrentUser() user: User) {
    return this.cashClose.preview(query.sucursalId, query.dia, user);
  }

  @Get('cierres')
  @ApiOperation({ summary: 'Daily cash closes (branch, days)' })
  closes(@Query() query: ListCashClosesQuery, @CurrentUser() user: User) {
    return this.cashClose.list(query, user);
  }

  @Post('cierres')
  @ApiOperation({ summary: 'Close the cash of a branch for a day (count by denomination; a difference needs a reason)' })
  close(@Body() dto: CloseCashDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.cashClose.close(dto, user, sessionId);
  }

  @Post('cierres/:id/aprobar')
  @ApiOperation({ summary: 'Approve a close; its difference is validated into the branch box (Administración, Contabilidad)' })
  approveClose(@Param('id') id: string, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.cashClose.review(id, 'aprobar', undefined, user, sessionId);
  }

  @Post('cierres/:id/observar')
  @ApiOperation({ summary: 'Observe a close with a reason; its difference is observed too (Administración, Contabilidad)' })
  observeClose(@Param('id') id: string, @Body() dto: ReasonDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.cashClose.review(id, 'observar', dto.motivo, user, sessionId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Ledger (commercial roles see all, técnico his own)' })
  list(@Query() query: ListMovementsQuery, @CurrentUser() user: User) {
    return this.ledger.list(query, user);
  }

  @Get('movements/export')
  @ApiOperation({ summary: 'The ledger (day, range, branch or company) as CSV or Excel' })
  async export(@Query() query: ExportMovementsQuery, @CurrentUser() user: User) {
    const { file, name, type } = await this.ledger.export(query, user);
    return new StreamableFile(file, { type, disposition: `attachment; filename="${name}"` });
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Dashboard money: month cobrado / en caja / expenses, box balances, today per branch' })
  summary(@Query('mes') mes: string | undefined, @CurrentUser() user: User) {
    return this.ledger.summary(user, mes);
  }

  @Get('anticipos')
  @ApiOperation({ summary: 'Advances still to be accounted for, with days late' })
  advances(@CurrentUser() user: User) {
    return this.ledger.advances(user);
  }

  @Post('movements/:id/rendido')
  @ApiOperation({ summary: 'Mark an advance as accounted for (Administración, Contabilidad)' })
  settle(@Param('id') id: string, @Body() dto: SettleAdvanceDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.settleAdvance(id, dto.nota, user, sessionId);
  }

  @Get('por-rendir')
  @ApiOperation({ summary: 'Money not yet validated, per person who holds it' })
  custody(@CurrentUser() user: User) {
    return this.ledger.custody(user);
  }

  @Get('movements/:id')
  @ApiOperation({ summary: 'One movement' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.ledger.get(id, user);
  }

  @Get('movements/:id/impacto')
  @ApiOperation({ summary: 'What validating or annulling it changes (boxes, balance owed, cost)' })
  impact(@Param('id') id: string, @Query() query: ImpactQuery, @CurrentUser() user: User) {
    return this.ledger.impact(id, query, user);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Register an expense, another income or a transfer (project/job payments go through them)' })
  create(@Body() dto: CreateMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.create(dto, user, sessionId);
  }

  @Patch('movements/:id')
  @ApiOperation({ summary: 'Correct a movement: its author while it waits; Gerencia or Contabilidad always (history keeps every change)' })
  update(@Param('id') id: string, @Body() dto: UpdateMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.update(id, dto, user, sessionId);
  }

  @Post('movements/:id/validar')
  @ApiOperation({ summary: 'Validate into a cash box (Gerencia, Contabilidad)' })
  validate(@Param('id') id: string, @Body() dto: ValidateMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.transition(id, 'validado', { cajaId: dto.cajaId }, user, sessionId);
  }

  @Post('movements/:id/observar')
  @ApiOperation({ summary: 'Send back with a reason (Gerencia, Contabilidad)' })
  observe(@Param('id') id: string, @Body() dto: ReasonDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.transition(id, 'observado', { motivo: dto.motivo }, user, sessionId);
  }

  @Post('movements/:id/anular')
  @ApiOperation({ summary: 'Annul with a reason (a validated one leaves its box: Gerencia, Contabilidad)' })
  cancel(@Param('id') id: string, @Body() dto: ReasonDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.transition(id, 'anulado', { motivo: dto.motivo }, user, sessionId);
  }

  @Post('movements/:id/reembolsar')
  @ApiOperation({ summary: 'Mark an employee expense as refunded (Gerencia, Contabilidad)' })
  refund(@Param('id') id: string, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.ledger.refund(id, user, sessionId);
  }

  @Get('cajas')
  @ApiOperation({ summary: 'Cash boxes with their validated balance' })
  cashBoxes(@CurrentUser() user: User) {
    return this.ledger.cashBoxes(user);
  }
}
