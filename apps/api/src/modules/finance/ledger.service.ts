import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { canRegisterMovements, canSeeLedger, canValidateMovements } from '../../common/policy/policy';
import { CreateMovementDto, ListMovementsQuery, UpdateMovementDto } from './dto/finance.dto';
import {
  cashBoxBalance,
  checkMovementTransition,
  editMovementError,
  movementError,
  pendingRefund,
  reversalOf,
} from './domain/finance.rules';
import { MOVEMENT_DETAIL, presentMovement } from './movement.presenter';

const dayEnd = (iso: string) => new Date(`${iso.slice(0, 10)}T23:59:59.999Z`);

/** The ledger: expenses, other incomes and transfers; validation into cash boxes (rendición); reversals and refunds. */
@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertValidator(user: User) {
    if (!canValidateMovements(user)) throw new ForbiddenException('Solo Gerencia valida movimientos y gestiona cajas');
  }

  private async row(id: string) {
    const row = await this.prisma.cashMovement.findUnique({ where: { id }, include: MOVEMENT_DETAIL });
    if (!row) throw new NotFoundException('Movimiento no encontrado');
    return row;
  }

  async list(query: ListMovementsQuery, user: User) {
    if (!canRegisterMovements(user)) throw new ForbiddenException('Sin acceso a finanzas');
    const rows = await this.prisma.cashMovement.findMany({
      where: {
        ...(canSeeLedger(user) ? {} : { registradoPorId: user.id }),
        ...(query.tipo ? { tipo: query.tipo } : {}),
        ...(query.estado ? { estado: query.estado } : {}),
        ...(query.cajaId ? { OR: [{ cajaId: query.cajaId }, { cajaDestinoId: query.cajaId }] } : {}),
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.clienteId ? { clienteId: query.clienteId } : {}),
        ...(query.desde || query.hasta
          ? { fecha: { ...(query.desde ? { gte: new Date(query.desde) } : {}), ...(query.hasta ? { lte: dayEnd(query.hasta) } : {}) } }
          : {}),
      },
      include: MOVEMENT_DETAIL,
      orderBy: { fecha: 'desc' },
      take: 1000,
    });
    return rows.map(presentMovement);
  }

  /** Expenses (anyone), other incomes (commercial) and transfers (Gerencia). Payments of projects and jobs go through them. */
  async create(dto: CreateMovementDto, user: User, sessionId?: string) {
    if (!canRegisterMovements(user)) throw new ForbiddenException('Sin acceso a finanzas');
    if (dto.tipo === 'ingreso' && ['adelanto', 'cobro', 'adicional'].includes(dto.concepto)) {
      throw new BadRequestException('Los cobros se registran desde el proyecto o el trabajo');
    }
    if (dto.tipo === 'ingreso' && !canSeeLedger(user)) throw new ForbiddenException('Solo ventas o Gerencia registran otros ingresos');
    if (dto.tipo === 'transferencia') this.assertValidator(user);
    const error = movementError(dto);
    if (error) throw new BadRequestException(error);
    const project = dto.projectId ? await this.prisma.project.findUnique({ where: { id: dto.projectId } }) : null;
    if (dto.projectId && !project) throw new BadRequestException('Proyecto no encontrado');
    const sucursalId = dto.sucursalId || project?.sucursalId || user.sucursalId;
    if (!sucursalId) throw new BadRequestException('Indica la sucursal');
    const transfer = dto.tipo === 'transferencia';
    const row = await this.prisma.cashMovement.create({
      data: {
        tipo: dto.tipo,
        concepto: dto.concepto,
        monto: dto.monto,
        fecha: dto.fecha ? new Date(dto.fecha) : new Date(),
        metodo: dto.metodo || '',
        nota: dto.nota || '',
        projectId: project?.id ?? null,
        clienteId: project?.clienteId ?? null,
        cajaId: transfer ? dto.cajaId : null,
        cajaDestinoId: transfer ? dto.cajaDestinoId : null,
        pagadoPor: dto.tipo === 'egreso' ? dto.pagadoPor : null,
        sucursalId,
        registradoPorId: user.id,
        // A transfer is done by Gerencia between its own boxes: it is valid as soon as it is registered.
        ...(transfer ? { estado: 'validado', validadoPorId: user.id, validadoAt: new Date() } : {}),
      },
      include: MOVEMENT_DETAIL,
    });
    await this.audit.record({ user, sessionId, action: `movement.${dto.tipo}`, entity: 'movement', id: row.id, affects: project ? ['project'] : [] });
    return presentMovement(row);
  }

  /** Correct a movement before validation; an observed one goes back to the validation inbox. */
  async update(id: string, dto: UpdateMovementDto, user: User, sessionId?: string) {
    const before = await this.row(id);
    if (before.registradoPorId !== user.id && !canValidateMovements(user)) throw new ForbiddenException('Solo quien lo registró o Gerencia lo corrige');
    const blocked = editMovementError(before);
    if (blocked) throw new BadRequestException(blocked);
    const next = { tipo: before.tipo, concepto: dto.concepto ?? before.concepto, monto: dto.monto ?? Number(before.monto), cajaId: before.cajaId, cajaDestinoId: before.cajaDestinoId, pagadoPor: dto.pagadoPor ?? before.pagadoPor };
    const error = movementError(next);
    if (error) throw new BadRequestException(error);
    const after = await this.prisma.cashMovement.update({
      where: { id },
      data: {
        ...(dto.concepto !== undefined ? { concepto: dto.concepto } : {}),
        ...(dto.monto !== undefined ? { monto: dto.monto } : {}),
        ...(dto.fecha !== undefined ? { fecha: new Date(dto.fecha) } : {}),
        ...(dto.metodo !== undefined ? { metodo: dto.metodo } : {}),
        ...(dto.nota !== undefined ? { nota: dto.nota } : {}),
        ...(dto.pagadoPor !== undefined && before.tipo === 'egreso' ? { pagadoPor: dto.pagadoPor } : {}),
        ...(before.estado === 'observado' ? { estado: 'por_validar', motivo: null } : {}),
      },
      include: MOVEMENT_DETAIL,
    });
    await this.audit.record({ user, sessionId, action: 'movement.update', entity: 'movement', id, before, after, affects: this.affects(before) });
    return presentMovement(after);
  }

  /** validado (Gerencia, into a box) · observado (Gerencia, reason) · anulado (Gerencia or whoever registered it, reason). */
  async transition(id: string, to: 'validado' | 'observado' | 'anulado', input: { cajaId?: string; motivo?: string }, user: User, sessionId?: string) {
    const before = await this.row(id);
    if (to !== 'anulado' || before.registradoPorId !== user.id) this.assertValidator(user);
    const check = checkMovementTransition(before, to, input);
    if (!check.ok) throw new BadRequestException(check.reason);
    if (to === 'validado' && input.cajaId) {
      const box = await this.prisma.cashBox.findUnique({ where: { id: input.cajaId } });
      if (!box?.active) throw new BadRequestException('Caja no válida');
    }
    const data: Prisma.CashMovementUncheckedUpdateInput =
      to === 'validado'
        ? { estado: 'validado', ...(before.tipo !== 'transferencia' ? { cajaId: input.cajaId } : {}), validadoPorId: user.id, validadoAt: new Date(), motivo: null }
        : { estado: to, motivo: input.motivo!.trim() };
    const after = await this.prisma.cashMovement.update({ where: { id }, data, include: MOVEMENT_DETAIL });
    await this.audit.record({ user, sessionId, action: `movement.${to}`, entity: 'movement', id, before, after, affects: this.affects(before) });
    return presentMovement(after);
  }

  /** A validated movement is corrected with its opposite, validated in the same box. */
  async reverse(id: string, motivo: string, user: User, sessionId?: string) {
    this.assertValidator(user);
    const original = await this.row(id);
    if (original.estado !== 'validado') throw new BadRequestException('Solo se revierte un movimiento validado');
    if (await this.prisma.cashMovement.findUnique({ where: { reversaDeId: id } })) throw new BadRequestException('Este movimiento ya fue revertido');
    const opposite = reversalOf(original);
    const row = await this.prisma.cashMovement.create({
      data: {
        ...opposite,
        monto: original.monto,
        nota: `Reverso de ${original.concepto}: ${motivo.trim()}`,
        motivo: motivo.trim(),
        estado: 'validado',
        reversaDeId: id,
        projectId: original.projectId,
        scheduleId: original.scheduleId,
        clienteId: original.clienteId,
        sucursalId: original.sucursalId,
        registradoPorId: user.id,
        validadoPorId: user.id,
        validadoAt: new Date(),
      },
      include: MOVEMENT_DETAIL,
    });
    await this.audit.record({ user, sessionId, action: 'movement.reverse', entity: 'movement', id: row.id, affects: this.affects(original), patch: { reversaDeId: id } });
    return presentMovement(row);
  }

  /** Marks an employee's expense as given back. */
  async refund(id: string, user: User, sessionId?: string) {
    this.assertValidator(user);
    const before = await this.row(id);
    if (!pendingRefund(before)) throw new BadRequestException('No hay reembolso pendiente en este movimiento');
    const after = await this.prisma.cashMovement.update({ where: { id }, data: { reembolsadoAt: new Date() }, include: MOVEMENT_DETAIL });
    await this.audit.record({ user, sessionId, action: 'movement.refund', entity: 'movement', id, before, after });
    return presentMovement(after);
  }

  /** Active boxes with their validated balance. */
  async cashBoxes(user: User) {
    if (!canRegisterMovements(user)) throw new ForbiddenException('Sin acceso a finanzas');
    const [boxes, movements] = await Promise.all([
      this.prisma.cashBox.findMany({ where: { active: true }, include: { sucursal: { select: { id: true, nombre: true } } }, orderBy: { nombre: 'asc' } }),
      this.prisma.cashMovement.findMany({ where: { estado: 'validado' }, select: { tipo: true, concepto: true, monto: true, estado: true, cajaId: true, cajaDestinoId: true } }),
    ]);
    return boxes.map((box) => ({ ...box, saldo: cashBoxBalance(box.id, movements) }));
  }

  private affects(m: { projectId: string | null; scheduleId: string | null }) {
    return [...(m.projectId ? ['project'] : []), ...(m.scheduleId ? ['schedule'] : []), 'client'];
  }
}
