import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { canRegisterMovements, canSeeLedger, canValidateMovements } from '../../common/policy/policy';
import { CreateMovementDto, ImpactQuery, ListMovementsQuery, UpdateMovementDto } from './dto/finance.dto';
import {
  cashBoxBalance,
  checkMovementTransition,
  custody,
  editMovementError,
  expensesOf,
  incomeError,
  incomeOf,
  movementError,
  movementDate,
  movementImpact,
  pendingRefund,
} from './domain/finance.rules';
import { MOVEMENT_DETAIL, presentMovement } from './movement.presenter';

const dayEnd = (iso: string) => new Date(`${iso.slice(0, 10)}T23:59:59.999Z`);

/** The ledger: expenses, other incomes and transfers; validation into cash boxes (rendición); corrections and refunds. */
@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private assertValidator(user: User) {
    if (!canValidateMovements(user)) throw new ForbiddenException('Solo Gerencia o Contabilidad validan movimientos y gestionan cajas');
  }

  private async row(id: string) {
    const row = await this.prisma.cashMovement.findUnique({ where: { id }, include: MOVEMENT_DETAIL });
    if (!row) throw new NotFoundException('Movimiento no encontrado');
    return row;
  }

  /** One movement (the side panel): the author always, the whole ledger for commercial roles and Contabilidad. */
  async get(id: string, user: User) {
    if (!canRegisterMovements(user)) throw new ForbiddenException('Sin acceso a finanzas');
    const row = await this.row(id);
    if (!canSeeLedger(user) && row.registradoPorId !== user.id && row.recibidoPorId !== user.id) throw new ForbiddenException('Sin acceso a este movimiento');
    return presentMovement(row);
  }

  async list(query: ListMovementsQuery, user: User) {
    if (!canRegisterMovements(user)) throw new ForbiddenException('Sin acceso a finanzas');
    const rows = await this.prisma.cashMovement.findMany({
      where: {
        AND: [
          canSeeLedger(user) ? {} : { OR: [{ registradoPorId: user.id }, { recibidoPorId: user.id }] },
          query.cajaId ? { OR: [{ cajaId: query.cajaId }, { cajaDestinoId: query.cajaId }] } : {},
        ],
        ...(query.tipo ? { tipo: query.tipo } : {}),
        ...(query.estado ? { estado: query.estado } : {}),
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.clienteId ? { clienteId: query.clienteId } : {}),
        ...(query.desde || query.hasta
          ? { fecha: { ...(query.desde ? { gte: new Date(query.desde) } : {}), ...(query.hasta ? { lte: dayEnd(query.hasta) } : {}) } }
          : {}),
      },
      include: MOVEMENT_DETAIL,
      // Same instant (or a day without time from before FIX-01): the last registered first.
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
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
    if (dto.tipo === 'ingreso' && !canSeeLedger(user)) throw new ForbiddenException('Solo ventas, Gerencia o Contabilidad registran otros ingresos');
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
        fecha: movementDate(dto.fecha),
        metodo: dto.metodo || '',
        nota: dto.nota || '',
        projectId: project?.id ?? null,
        clienteId: project?.clienteId ?? null,
        cajaId: transfer ? dto.cajaId : null,
        cajaDestinoId: transfer ? dto.cajaDestinoId : null,
        pagadoPor: dto.tipo === 'egreso' ? dto.pagadoPor : null,
        sucursalId,
        registradoPorId: user.id,
        ...(dto.tipo === 'ingreso' ? { recibidoPorId: user.id } : {}),
        // A transfer is done by Gerencia between its own boxes: it is valid as soon as it is registered.
        ...(transfer ? { estado: 'validado', validadoPorId: user.id, validadoAt: new Date() } : {}),
      },
      include: MOVEMENT_DETAIL,
    });
    await this.audit.record({ user, sessionId, action: `movement.${dto.tipo}`, entity: 'movement', id: row.id, affects: project ? ['project'] : [] });
    return presentMovement(row);
  }

  /**
   * Correct a movement: its author while it waits; Gerencia and Contabilidad at any time, a validated one included
   * (also who holds an income and the box of a validated movement). Every change is in the history (before/after).
   * An observed one goes back to the validation inbox.
   */
  async update(id: string, dto: UpdateMovementDto, user: User, sessionId?: string) {
    const before = await this.row(id);
    const manager = canValidateMovements(user);
    if (before.registradoPorId !== user.id && !manager) throw new ForbiddenException('Solo quien lo registró, Gerencia o Contabilidad lo corrigen');
    const blocked = editMovementError(before, manager);
    if (blocked) throw new BadRequestException(blocked);
    if (dto.cajaId !== undefined && (!manager || before.estado !== 'validado' || before.tipo === 'transferencia')) {
      throw new BadRequestException('La caja se cambia solo en un movimiento validado, y lo hacen Gerencia o Contabilidad');
    }
    if (dto.cajaId) await this.assertBox(dto.cajaId);
    if (dto.recibidoPorId !== undefined) {
      if (before.tipo !== 'ingreso') throw new BadRequestException('Solo un ingreso tiene quién recibió el dinero');
      await this.assertActiveUser(dto.recibidoPorId);
    }
    const next = { tipo: before.tipo, concepto: dto.concepto ?? before.concepto, monto: dto.monto ?? Number(before.monto), cajaId: before.cajaId, cajaDestinoId: before.cajaDestinoId, pagadoPor: dto.pagadoPor ?? before.pagadoPor };
    const moneyChanged = (dto.monto !== undefined && dto.monto !== Number(before.monto)) || (dto.concepto !== undefined && dto.concepto !== before.concepto);
    const target = before.tipo === 'ingreso' && moneyChanged ? await this.target(before) : null;
    // The same balance rule as when it was registered (only when the amount or concept changes), without counting itself.
    const counted = ['por_validar', 'validado'].includes(before.estado) && ['adelanto', 'cobro'].includes(before.concepto) ? Number(before.monto) : 0;
    const error = movementError(next) || (target ? incomeError({ ...target, cobrado: target.cobrado - counted }, next.concepto, next.monto) : null);
    if (error) throw new BadRequestException(error);
    const after = await this.prisma.cashMovement.update({
      where: { id },
      data: {
        ...(dto.concepto !== undefined ? { concepto: dto.concepto } : {}),
        ...(dto.monto !== undefined ? { monto: dto.monto } : {}),
        ...(dto.fecha !== undefined ? { fecha: movementDate(dto.fecha, new Date(), before.fecha) } : {}),
        ...(dto.metodo !== undefined ? { metodo: dto.metodo } : {}),
        ...(dto.nota !== undefined ? { nota: dto.nota } : {}),
        ...(dto.pagadoPor !== undefined && before.tipo === 'egreso' ? { pagadoPor: dto.pagadoPor } : {}),
        ...(dto.recibidoPorId !== undefined ? { recibidoPorId: dto.recibidoPorId } : {}),
        ...(dto.cajaId ? { cajaId: dto.cajaId } : {}),
        ...(before.estado === 'observado' ? { estado: 'por_validar', motivo: null } : {}),
      },
      include: MOVEMENT_DETAIL,
    });
    await this.audit.record({ user, sessionId, action: 'movement.update', entity: 'movement', id, before, after, affects: this.affects(before) });
    return presentMovement(after);
  }

  /**
   * validado (Gerencia or Contabilidad, into a box) · observado (same, reason) · anulado (same, or the author while it
   * waits; reason). Annulling a validated movement takes it out of its box.
   */
  async transition(id: string, to: 'validado' | 'observado' | 'anulado', input: { cajaId?: string; motivo?: string }, user: User, sessionId?: string) {
    const before = await this.row(id);
    const ownWaiting = to === 'anulado' && before.registradoPorId === user.id && before.estado !== 'validado';
    if (!ownWaiting) this.assertValidator(user);
    const check = checkMovementTransition(before, to, input);
    if (!check.ok) throw new BadRequestException(check.reason);
    if (to === 'validado' && input.cajaId) await this.assertBox(input.cajaId);
    const data: Prisma.CashMovementUncheckedUpdateInput =
      to === 'validado'
        ? { estado: 'validado', ...(before.tipo !== 'transferencia' ? { cajaId: input.cajaId } : {}), validadoPorId: user.id, validadoAt: new Date(), motivo: null }
        : { estado: to, motivo: input.motivo!.trim() };
    const after = await this.prisma.cashMovement.update({ where: { id }, data, include: MOVEMENT_DETAIL });
    await this.audit.record({ user, sessionId, action: `movement.${to}`, entity: 'movement', id, before, after, affects: this.affects(before) });
    return presentMovement(after);
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

  /** Who holds money not yet validated (incomes por_validar), per person, largest first. */
  async custody(user: User) {
    if (!canSeeLedger(user)) throw new ForbiddenException('Sin acceso a finanzas');
    const rows = await this.prisma.cashMovement.findMany({
      where: { tipo: 'ingreso', estado: 'por_validar', recibidoPorId: { not: null } },
      include: MOVEMENT_DETAIL,
      orderBy: { fecha: 'asc' },
    });
    return custody(rows).map((group) => ({
      ...group,
      persona: group.movimientos[0].recibidoPor,
      movimientos: group.movimientos.map(presentMovement),
    }));
  }

  /** What validating (into `cajaId`) or annulling this movement changes: box balances, balance owed or cost of its project or job. */
  async impact(id: string, query: ImpactQuery, user: User) {
    this.assertValidator(user);
    const m = await this.row(id);
    const [boxes, target] = await Promise.all([this.cashBoxes(user), this.target(m)]);
    const balances = Object.fromEntries(boxes.map((b) => [b.id, b.saldo]));
    const names = Object.fromEntries(boxes.map((b) => [b.id, b.nombre]));
    const efectos = movementImpact(m, query.accion, { boxes: balances, cajaId: query.cajaId, target });
    return {
      efectos: efectos.map((e) => (e.tipo === 'caja' ? { ...e, caja: names[e.cajaId] ?? e.cajaId } : { ...e, de: m.project?.codigo ?? m.schedule?.descripcionTrabajo ?? null })),
    };
  }

  /** The project or stand-alone job a movement belongs to: amount, collected and cost (read-only). */
  private async target(m: { projectId: string | null; scheduleId: string | null }) {
    if (!m.projectId && !m.scheduleId) return null;
    const where = m.projectId ? { projectId: m.projectId } : { scheduleId: m.scheduleId, projectId: null };
    const [owner, movements] = await Promise.all([
      m.projectId
        ? this.prisma.project.findUnique({ where: { id: m.projectId }, select: { montoOficial: true, estado: true } })
        : this.prisma.schedule.findUnique({ where: { id: m.scheduleId! }, select: { monto: true, estado: true } }),
      this.prisma.cashMovement.findMany({ where, select: { tipo: true, concepto: true, monto: true, estado: true } }),
    ]);
    if (!owner) return null;
    const monto = Number('montoOficial' in owner ? owner.montoOficial : owner.monto);
    const cancelled = owner.estado === 'anulado' || owner.estado === 'cancelado';
    return { monto, cobrado: incomeOf(movements).cobrado, costo: expensesOf(movements), cancelled };
  }

  private async assertBox(cajaId: string) {
    const box = await this.prisma.cashBox.findUnique({ where: { id: cajaId } });
    if (!box?.active) throw new BadRequestException('Caja no válida');
  }

  private async assertActiveUser(userId: string) {
    const person = await this.prisma.user.findUnique({ where: { id: userId }, select: { active: true } });
    if (!person?.active) throw new BadRequestException('La persona que recibió el dinero no existe o está inactiva');
  }

  private affects(m: { projectId: string | null; scheduleId: string | null }) {
    return [...(m.projectId ? ['project'] : []), ...(m.scheduleId ? ['schedule'] : []), 'client'];
  }
}
