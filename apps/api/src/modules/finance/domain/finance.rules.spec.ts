import {
  qrDestinationError,
  balanceOf,
  cashBoxBalance,
  checkMovementTransition,
  editMovementError,
  expensesOf,
  incomeConceptError,
  incomeError,
  incomeOf,
  advanceError,
  monthMoney,
  daysLate,
  movementDate,
  movementError,
  custody,
  movementImpact,
  pendingRefund,
} from './finance.rules';

const m = (tipo: string, concepto: string, monto: number, estado = 'validado', extra = {}) => ({ tipo, concepto, monto, estado, ...extra });

describe('finance rules', () => {
  it('a QR payment names its QR; other methods do not (LAUNCH P1-1)', () => {
    expect(qrDestinationError('qr', undefined)).toMatch(/a qué QR/);
    expect(qrDestinationError('QR', 'qr_personal')).toBeNull();
    expect(qrDestinationError('efectivo', undefined)).toBeNull();
    expect(qrDestinationError('efectivo', 'qr_empresa')).toMatch(/solo para cobros por QR/);
  });

  it('validates type, concept, amount, transfers and who paid an expense', () => {
    expect(movementError({ tipo: 'ingreso', concepto: 'cobro', monto: 10 })).toBeNull();
    expect(movementError({ tipo: 'ingreso', concepto: 'combustible', monto: 10 })).toMatch(/Concepto no válido/);
    expect(movementError({ tipo: 'egreso', concepto: 'combustible', monto: 0, pagadoPor: 'empresa' })).toMatch(/mayor a 0/);
    expect(movementError({ tipo: 'egreso', concepto: 'combustible', monto: 50 })).toMatch(/quién pagó/);
    expect(movementError({ tipo: 'transferencia', concepto: 'deposito', monto: 50, cajaId: 'a', cajaDestinoId: 'a' })).toMatch(/distintas/);
    expect(movementError({ tipo: 'transferencia', concepto: 'deposito', monto: 50, cajaId: 'a', cajaDestinoId: 'b' })).toBeNull();
  });

  it('validates into a cash box; observes and cancels with a reason; a validated one can only be annulled', () => {
    expect(checkMovementTransition({ estado: 'por_validar', tipo: 'ingreso' }, 'validado', {})).toEqual({ ok: false, reason: 'Elige la caja donde queda el dinero' });
    expect(checkMovementTransition({ estado: 'por_validar', tipo: 'ingreso' }, 'validado', { cajaId: 'c1' })).toEqual({ ok: true });
    expect(checkMovementTransition({ estado: 'por_validar', tipo: 'ingreso' }, 'observado', {})).toEqual({ ok: false, reason: 'Indica el motivo' });
    expect(checkMovementTransition({ estado: 'observado', tipo: 'ingreso' }, 'por_validar', {})).toEqual({ ok: true });
    expect(checkMovementTransition({ estado: 'validado', tipo: 'ingreso' }, 'anulado', { motivo: 'x' }).ok).toBe(true);
    expect(checkMovementTransition({ estado: 'validado', tipo: 'ingreso' }, 'anulado', {}).ok).toBe(false);
    expect(checkMovementTransition({ estado: 'validado', tipo: 'ingreso' }, 'observado', { motivo: 'x' }).ok).toBe(false);
    expect(checkMovementTransition({ estado: 'anulado', tipo: 'ingreso' }, 'por_validar', {}).ok).toBe(false);
  });

  it('lets the author edit while it waits, and Gerencia or Contabilidad also once validated (FIN-03)', () => {
    expect(editMovementError({ estado: 'observado' }, false)).toBeNull();
    expect(editMovementError({ estado: 'validado' }, false)).toMatch(/Gerencia o Contabilidad/);
    expect(editMovementError({ estado: 'validado' }, true)).toBeNull();
    expect(editMovementError({ estado: 'anulado' }, true)).toMatch(/anulado/);
  });

  it('counts registered and validated advances and payments; observed or cancelled ones do not count', () => {
    const rows = [m('ingreso', 'adelanto', 1000), m('ingreso', 'cobro', 500, 'por_validar'), m('ingreso', 'cobro', 99, 'observado'), m('ingreso', 'adicional', 300), m('egreso', 'material', 200)];
    expect(incomeOf(rows)).toEqual({ cobrado: 1500, porValidar: 500, adicionales: 300 });
    expect(expensesOf(rows)).toBe(200);
  });

  it('owes the rest unless cancelled, and refuses a payment above the balance', () => {
    expect(balanceOf(2500, 1500, false)).toBe(1000);
    expect(balanceOf(2500, 1500, true)).toBe(0);
    expect(incomeError({ monto: 2500, cobrado: 1500, cancelled: false }, 'cobro', 1001)).toMatch(/supera el saldo pendiente \(1000\)/);
    expect(incomeError({ monto: 2500, cobrado: 1500, cancelled: false }, 'adicional', 5000)).toBeNull();
    expect(incomeError({ monto: 2500, cobrado: 0, cancelled: true }, 'cobro', 10)).toMatch(/anulado/);
    expect(incomeError({ monto: 2500, cobrado: 0, cancelled: false, closed: true }, 'cobro', 10)).toMatch(/cerrado/);
  });

  it('charges a visit only as asistencia, and asistencia only on a visit', () => {
    expect(incomeConceptError('visita', 'asistencia')).toBeNull();
    expect(incomeConceptError('visita', 'cobro')).toMatch(/asistencia/);
    expect(incomeConceptError('trabajo', 'asistencia')).toMatch(/solo para visitas/);
    expect(incomeConceptError('trabajo', 'adicional')).toBeNull();
    expect(incomeError({ monto: 0, cobrado: 0, cancelled: false }, 'asistencia', 150)).toBeNull();
  });

  it('computes a cash box from validated movements only', () => {
    const rows = [
      m('ingreso', 'cobro', 1000, 'validado', { cajaId: 'c1' }),
      m('ingreso', 'cobro', 700, 'por_validar', { cajaId: 'c1' }),
      m('egreso', 'combustible', 100, 'validado', { cajaId: 'c1' }),
      m('transferencia', 'deposito', 400, 'validado', { cajaId: 'c1', cajaDestinoId: 'c2' }),
    ];
    expect(cashBoxBalance('c1', rows)).toBe(500);
    expect(cashBoxBalance('c2', rows)).toBe(400);
  });

  it('tracks refunds owed to employees', () => {
    expect(pendingRefund({ tipo: 'egreso', pagadoPor: 'empleado', estado: 'validado' })).toBe(true);
    expect(pendingRefund({ tipo: 'egreso', pagadoPor: 'empleado', estado: 'validado', reembolsadoAt: new Date() })).toBe(false);
    expect(pendingRefund({ tipo: 'egreso', pagadoPor: 'empresa', estado: 'validado' })).toBe(false);
  });

  it('groups the money each person holds until it is validated (por rendir)', () => {
    const rows = [
      m('ingreso', 'cobro', 300, 'por_validar', { recibidoPorId: 'tec' }),
      m('ingreso', 'adelanto', 200, 'por_validar', { recibidoPorId: 'tec' }),
      m('ingreso', 'cobro', 900, 'por_validar', { recibidoPorId: 'ven' }),
      m('ingreso', 'cobro', 50, 'validado', { recibidoPorId: 'tec' }),
      m('egreso', 'material', 70, 'por_validar', { recibidoPorId: 'tec' }),
    ];
    expect(custody(rows).map(({ userId, total, cantidad }) => ({ userId, total, cantidad }))).toEqual([
      { userId: 'ven', total: 900, cantidad: 1 },
      { userId: 'tec', total: 500, cantidad: 2 },
    ]);
  });

  it('tells what a validation or an annulment changes: boxes, balance owed, cost', () => {
    const boxes = { c1: 5200, c2: 100 };
    const target = { monto: 3000, cobrado: 1000, costo: 400, cancelled: false };
    expect(movementImpact(m('ingreso', 'cobro', 500, 'por_validar'), 'validar', { boxes, cajaId: 'c1' })).toEqual([{ tipo: 'caja', cajaId: 'c1', antes: 5200, despues: 5700 }]);
    expect(movementImpact(m('ingreso', 'cobro', 500, 'validado', { cajaId: 'c1' }), 'anular', { boxes, target })).toEqual([
      { tipo: 'caja', cajaId: 'c1', antes: 5200, despues: 4700 },
      { tipo: 'saldo', antes: 2000, despues: 2500 },
    ]);
    expect(movementImpact(m('egreso', 'material', 100, 'por_validar'), 'anular', { boxes, target })).toEqual([{ tipo: 'costo', antes: 400, despues: 300 }]);
    expect(movementImpact(m('transferencia', 'deposito', 50, 'validado', { cajaId: 'c1', cajaDestinoId: 'c2' }), 'anular', { boxes })).toEqual([
      { tipo: 'caja', cajaId: 'c1', antes: 5200, despues: 5250 },
      { tipo: 'caja', cajaId: 'c2', antes: 100, despues: 50 },
    ]);
  });

  it('keeps the Bolivian time of day when a form sends only the day (FIX-01)', () => {
    const now = new Date('2026-10-27T15:42:10.000Z'); // 11:42 in Bolivia
    expect(movementDate(undefined, now)).toEqual(now);
    expect(movementDate('2026-10-25', now).toISOString()).toBe('2026-10-25T15:42:10.000Z');
    expect(movementDate('2026-10-25T08:00:00.000Z', now).toISOString()).toBe('2026-10-25T08:00:00.000Z');
    // 22:30 in Bolivia is already the next day in UTC: the movement still belongs to the Bolivian day picked.
    const night = new Date('2026-10-28T02:30:00.000Z');
    expect(movementDate('2026-10-27', night).toISOString()).toBe('2026-10-28T02:30:00.000Z');
    const before = new Date('2026-10-26T01:00:00.000Z'); // 25 Oct, 21:00 in Bolivia
    expect(movementDate('2026-10-25', now, before)).toBe(before);
    expect(movementDate('2026-10-26', now, before).toISOString()).toBe('2026-10-26T15:42:10.000Z');
  });

  it('an advance to account for needs who, what for and until when; lateness in days (FIN-04)', () => {
    expect(advanceError({ concepto: 'material' })).toBeNull();
    expect(advanceError({ concepto: 'anticipo_por_rendir', asunto: 'x', fechaLimite: '2026-10-30' })).toMatch(/a quién/);
    expect(advanceError({ concepto: 'anticipo_por_rendir', responsableId: 'u', fechaLimite: '2026-10-30' })).toMatch(/asunto/);
    expect(advanceError({ concepto: 'anticipo_por_rendir', responsableId: 'u', asunto: 'Insumos' })).toMatch(/hasta cuándo/);
    expect(advanceError({ concepto: 'anticipo_por_rendir', responsableId: 'u', asunto: 'Insumos', fechaLimite: '2026-10-30' })).toBeNull();
    expect(daysLate('2026-10-30', '2026-10-27')).toBe(0);
    expect(daysLate('2026-10-20T00:00:00Z', '2026-10-27')).toBe(7);
  });

  it('the money of a month: cobrado (waiting + validated), en caja (validated), expenses and net (DASH-01)', () => {
    expect(monthMoney([m('ingreso', 'cobro', 100), m('ingreso', 'cobro', 50, 'por_validar'), m('ingreso', 'cobro', 999, 'anulado'), m('egreso', 'material', 30), m('egreso', 'material', 7, 'por_validar'), m('transferencia', 'deposito', 500)]))
      .toEqual({ cobrado: 150, enCaja: 100, egresosValidados: 30, neto: 70, porValidar: 50 });
  });
});
