import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { businessDay, businessDayEnd, businessDayStart, businessToday } from '../../common/domain/calendar';
import { isAdmin, isVentas, ROLES } from '../../common/policy/policy';
import { CloseCashDto, ListCashClosesQuery } from './dto/cash-close.dto';
import { closeError, closeRequirements, countError, countTotal, differenceMovement, expectedCash, otherMethods, reviewError } from './domain/cash-close.rules';
import { cashBoxBalance } from './domain/finance.rules';
import { MOVEMENT_DETAIL, presentMovement } from './movement.presenter';

const USER_NAME = { select: { id: true, name: true } } as const;
const CLOSE_DETAIL = {
  sucursal: { select: { id: true, nombre: true } },
  caja: { select: { id: true, nombre: true } },
  cerradoPor: USER_NAME,
  revisadoPor: USER_NAME,
  diferenciaMovimiento: { select: { id: true, estado: true, tipo: true, monto: true } },
} satisfies Prisma.CierreCajaInclude;

const cents = (value: number) => Math.round(value * 100) / 100;

/**
 * The daily cash close of a branch (FIN-04; no shifts, owner 2026-10-27). The day's cash is computed from the ledger;
 * the cashier counts notes and coins; a difference needs a reason and becomes a movement por validar. A close is
 * never edited: a mistake is fixed with a new movement.
 */
@Injectable()
export class CashCloseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** A seller closes his branch; Gerencia (Administración, Contabilidad) any. */
  private assertCloser(user: User, sucursalId: string) {
    if (isAdmin(user)) return;
    if (isVentas(user) && user.sucursalId === sucursalId) return;
    throw new ForbiddenException('Cierras la caja de tu sucursal');
  }

  private async box(sucursalId: string) {
    const box = await this.prisma.cashBox.findFirst({ where: { sucursalId, active: true, tipo: { in: ['caja', 'caja_chica'] } } });
    if (!box) throw new BadRequestException('La sucursal no tiene caja de efectivo');
    return box;
  }

  /** What the day looks like before counting: opening cash, the movements that move it, expected cash, other methods. */
  async preview(sucursalId: string, dia: string, user: User) {
    if (!isAdmin(user) && !isVentas(user)) throw new ForbiddenException('Sin acceso al cierre de caja');
    const day = dia.slice(0, 10);
    const sucursal = await this.prisma.sucursal.findUnique({ where: { id: sucursalId } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    const box = await this.box(sucursalId);
    const [previous, existing, movements, sales] = await Promise.all([
      this.prisma.cierreCaja.findFirst({ where: { sucursalId, dia: { lt: day } }, orderBy: { dia: 'desc' } }),
      this.prisma.cierreCaja.findUnique({ where: { sucursalId_dia: { sucursalId, dia: day } }, include: CLOSE_DETAIL }),
      this.prisma.cashMovement.findMany({
        where: { fecha: { gte: businessDayStart(day), lte: businessDayEnd(day) }, OR: [{ sucursalId }, { cajaId: box.id }, { cajaDestinoId: box.id }] },
        include: MOVEMENT_DETAIL,
        orderBy: { fecha: 'asc' },
      }),
      this.prisma.directSale.aggregate({ where: { sucursalId, estado: 'registrada', fecha: { gte: businessDayStart(day), lte: businessDayEnd(day) } }, _count: true, _sum: { total: true } }),
    ]);
    // Opening cash: the previous count; on the branch's first close, the box balance before the day (it starts with the
    // `saldo_inicial` its operator registered on first use), never a number typed by the cashier.
    const inBox = { OR: [{ cajaId: box.id }, { cajaDestinoId: box.id }] };
    const saldoInicial = previous
      ? Number(previous.efectivoContado)
      : cashBoxBalance(box.id, await this.prisma.cashMovement.findMany({ where: { estado: 'validado', fecha: { lt: businessDayStart(day) }, ...inBox } }));
    // A day after the last close with movements and no close of its own must be closed first.
    const unclosed = previous
      ? await this.prisma.cashMovement.findFirst({
          where: {
            estado: { not: 'anulado' },
            concepto: { not: 'saldo_inicial' },
            fecha: { gt: businessDayEnd(previous.dia), lt: businessDayStart(day) },
            OR: [{ sucursalId }, { cajaId: box.id }, { cajaDestinoId: box.id }],
          },
          orderBy: { fecha: 'asc' },
          select: { fecha: true },
        })
      : null;
    const pendingDay = unclosed ? businessDay(unclosed.fecha) : null;
    // Money still waiting counts when the person holding it works at this branch's counter (not a técnico on a job).
    const counter = new Set((await this.prisma.user.findMany({ where: { sucursalId, active: true, role: { not: ROLES.TEC } }, select: { id: true } })).map((u) => u.id));
    const cash = expectedCash(saldoInicial ?? 0, movements, box.id, counter);
    const effect = new Map(cash.lines.map((l) => [l.id, l.efecto]));
    return {
      sucursal: { id: sucursal.id, nombre: sucursal.nombre },
      caja: { id: box.id, nombre: box.nombre },
      dia: day,
      saldoInicial,
      requisitos: closeRequirements({ dia: day, today: businessToday(new Date()), closed: Boolean(existing), pendingDay }),
      cierreAnterior: previous ? { dia: previous.dia, efectivoContado: Number(previous.efectivoContado) } : null,
      ingresosEfectivo: cash.ingresos,
      egresosEfectivo: cash.egresos,
      efectivoEsperado: cash.esperado,
      movimientos: movements.filter((m) => effect.has(m.id)).map((m) => ({ ...presentMovement(m), efecto: effect.get(m.id) })),
      ...otherMethods(movements),
      ventas: { cantidad: sales._count, total: Number(sales._sum.total ?? 0) },
      cierre: existing,
    };
  }

  async close(dto: CloseCashDto, user: User, sessionId?: string) {
    this.assertCloser(user, dto.sucursalId);
    const day = dto.dia.slice(0, 10);
    if (day > businessToday(new Date())) throw new BadRequestException('No se cierra un día que todavía no llegó');
    const countErr = countError(dto.conteo);
    if (countErr) throw new BadRequestException(countErr);
    const preview = await this.preview(dto.sucursalId, day, user);
    if (preview.cierre) throw new ConflictException(`La caja de ${preview.sucursal.nombre} ya se cerró el ${day}`);
    const missing = preview.requisitos.find((r) => !r.ok);
    if (missing) throw new BadRequestException(missing.texto);
    const saldoInicial = preview.saldoInicial;
    const esperado = cents(saldoInicial + preview.ingresosEfectivo - preview.egresosEfectivo);
    const contado = countTotal(dto.conteo);
    const diferencia = cents(contado - esperado);
    const error = closeError(diferencia, dto.motivoDiferencia);
    if (error) throw new BadRequestException(error);
    const extra = differenceMovement(diferencia);
    const row = await this.prisma.$transaction(async (tx) => {
      const movement = extra
        ? await tx.cashMovement.create({
            data: {
              tipo: extra.tipo,
              concepto: extra.concepto,
              monto: extra.monto,
              metodo: 'efectivo',
              nota: `${extra.label} del cierre del ${day} en ${preview.sucursal.nombre}: ${dto.motivoDiferencia!.trim()}`,
              sucursalId: dto.sucursalId,
              registradoPorId: user.id,
              ...(extra.tipo === 'egreso' ? { pagadoPor: 'empresa' } : { recibidoPorId: user.id }),
            },
          })
        : null;
      return tx.cierreCaja.create({
        data: {
          sucursalId: dto.sucursalId,
          cajaId: preview.caja.id,
          dia: day,
          saldoInicial,
          ingresosEfectivo: preview.ingresosEfectivo,
          egresosEfectivo: preview.egresosEfectivo,
          efectivoEsperado: esperado,
          conteo: dto.conteo as Prisma.InputJsonValue,
          efectivoContado: contado,
          diferencia,
          motivoDiferencia: dto.motivoDiferencia?.trim() || null,
          totalQr: preview.qr,
          totalTransferencia: preview.transferencia,
          ventasCantidad: preview.ventas.cantidad,
          ventasTotal: preview.ventas.total,
          observaciones: dto.observaciones?.trim() || null,
          cerradoPorId: user.id,
          diferenciaMovimientoId: movement?.id ?? null,
        },
        include: CLOSE_DETAIL,
      });
    });
    await this.audit.record({ user, sessionId, action: 'cashClose.create', entity: 'cashClose', id: row.id, patch: { dia: day, diferencia }, affects: extra ? ['movement'] : [] });
    return row;
  }

  async list(query: ListCashClosesQuery, user: User) {
    if (!isAdmin(user) && !isVentas(user)) throw new ForbiddenException('Sin acceso al cierre de caja');
    // A seller sees the history of his own branch (LAUNCH P1-2).
    const sucursalId = isAdmin(user) ? query.sucursalId : user.sucursalId;
    return this.prisma.cierreCaja.findMany({
      where: {
        ...(sucursalId ? { sucursalId } : {}),
        ...(query.desde || query.hasta ? { dia: { ...(query.desde ? { gte: query.desde.slice(0, 10) } : {}), ...(query.hasta ? { lte: query.hasta.slice(0, 10) } : {}) } } : {}),
      },
      include: CLOSE_DETAIL,
      orderBy: [{ dia: 'desc' }, { cerradoAt: 'desc' }],
      take: 500,
    });
  }

  /**
   * Gerencia approves a close (its difference, if any, is validated into the branch box in the same step) or observes
   * it with a reason (the difference is observed with it and goes back to the cashier). LAUNCH P1-3.
   */
  async review(id: string, action: 'aprobar' | 'observar', motivo: string | undefined, user: User, sessionId?: string) {
    if (!isAdmin(user)) throw new ForbiddenException('Solo Administración o Contabilidad revisan los cierres');
    const before = await this.prisma.cierreCaja.findUnique({ where: { id }, include: { diferenciaMovimiento: true } });
    if (!before) throw new NotFoundException('Cierre no encontrado');
    const error = reviewError(before.revisionEstado, action, motivo);
    if (error) throw new BadRequestException(error);
    const movement = before.diferenciaMovimiento;
    const open = movement && ['por_validar', 'observado'].includes(movement.estado);
    const row = await this.prisma.$transaction(async (tx) => {
      if (open && action === 'aprobar') {
        await tx.cashMovement.update({ where: { id: movement.id }, data: { estado: 'validado', cajaId: before.cajaId, validadoPorId: user.id, validadoAt: new Date(), motivo: null } });
      }
      if (open && action === 'observar') {
        await tx.cashMovement.update({ where: { id: movement.id }, data: { estado: 'observado', motivo: motivo!.trim() } });
      }
      return tx.cierreCaja.update({
        where: { id },
        data: {
          revisionEstado: action === 'aprobar' ? 'aprobado' : 'observado',
          revisionMotivo: action === 'observar' ? motivo!.trim() : null,
          revisadoPorId: user.id,
          revisadoAt: new Date(),
        },
        include: CLOSE_DETAIL,
      });
    });
    await this.audit.record({
      user,
      sessionId,
      action: `cashClose.${action}`,
      entity: 'cashClose',
      id,
      patch: { revisionEstado: row.revisionEstado, ...(action === 'observar' ? { motivo: row.revisionMotivo } : {}) },
      affects: open ? ['movement'] : [],
    });
    return row;
  }
}
