import {
  balanceOf,
  cashBoxBalance,
  checkMovementTransition,
  editMovementError,
  expensesOf,
  incomeError,
  incomeOf,
  movementError,
  pendingRefund,
  reversalOf,
} from './finance.rules';

const m = (tipo: string, concepto: string, monto: number, estado = 'validado', extra = {}) => ({ tipo, concepto, monto, estado, ...extra });

describe('finance rules', () => {
  it('validates type, concept, amount, transfers and who paid an expense', () => {
    expect(movementError({ tipo: 'ingreso', concepto: 'cobro', monto: 10 })).toBeNull();
    expect(movementError({ tipo: 'ingreso', concepto: 'combustible', monto: 10 })).toMatch(/Concepto no válido/);
    expect(movementError({ tipo: 'egreso', concepto: 'combustible', monto: 0, pagadoPor: 'empresa' })).toMatch(/mayor a 0/);
    expect(movementError({ tipo: 'egreso', concepto: 'combustible', monto: 50 })).toMatch(/quién pagó/);
    expect(movementError({ tipo: 'transferencia', concepto: 'deposito', monto: 50, cajaId: 'a', cajaDestinoId: 'a' })).toMatch(/distintas/);
    expect(movementError({ tipo: 'transferencia', concepto: 'deposito', monto: 50, cajaId: 'a', cajaDestinoId: 'b' })).toBeNull();
  });

  it('validates into a cash box; observes and cancels with a reason; validated is final', () => {
    expect(checkMovementTransition({ estado: 'por_validar', tipo: 'ingreso' }, 'validado', {})).toEqual({ ok: false, reason: 'Elige la caja donde queda el dinero' });
    expect(checkMovementTransition({ estado: 'por_validar', tipo: 'ingreso' }, 'validado', { cajaId: 'c1' })).toEqual({ ok: true });
    expect(checkMovementTransition({ estado: 'por_validar', tipo: 'ingreso' }, 'observado', {})).toEqual({ ok: false, reason: 'Indica el motivo' });
    expect(checkMovementTransition({ estado: 'observado', tipo: 'ingreso' }, 'por_validar', {})).toEqual({ ok: true });
    expect(checkMovementTransition({ estado: 'validado', tipo: 'ingreso' }, 'anulado', { motivo: 'x' }).ok).toBe(false);
    expect(editMovementError({ estado: 'validado' })).toMatch(/movimiento inverso/);
    expect(editMovementError({ estado: 'observado' })).toBeNull();
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

  it('tracks refunds owed to employees and reverses validated movements', () => {
    expect(pendingRefund({ tipo: 'egreso', pagadoPor: 'empleado', estado: 'validado' })).toBe(true);
    expect(pendingRefund({ tipo: 'egreso', pagadoPor: 'empleado', estado: 'validado', reembolsadoAt: new Date() })).toBe(false);
    expect(pendingRefund({ tipo: 'egreso', pagadoPor: 'empresa', estado: 'validado' })).toBe(false);
    expect(reversalOf({ tipo: 'ingreso', concepto: 'cobro', cajaId: 'c1' })).toEqual({ tipo: 'egreso', concepto: 'otro', cajaId: 'c1', cajaDestinoId: null });
    expect(reversalOf({ tipo: 'transferencia', concepto: 'deposito', cajaId: 'a', cajaDestinoId: 'b' })).toEqual({ tipo: 'transferencia', concepto: 'deposito', cajaId: 'b', cajaDestinoId: 'a' });
  });
});
