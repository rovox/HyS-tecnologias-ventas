import {
  categoryChangeError,
  adelantoChange,
  budgetPaid,
  checkScheduleTransition,
  legacyAdvance,
  montoChangeError,
  paymentError,
  saldo,
} from './schedules.rules';

describe('schedules domain', () => {
  it('allows only transitions in the flow', () => {
    expect(checkScheduleTransition('programado', 'en_proceso')).toEqual({ ok: true });
    expect(checkScheduleTransition('en_proceso', 'terminado')).toEqual({ ok: true });
    expect(checkScheduleTransition('terminado', 'programado')).toEqual({ ok: false, reason: 'Transición inválida: terminado → programado' });
    expect(checkScheduleTransition('programado', 'perdido')).toEqual({ ok: false, reason: 'Estado desconocido: perdido' });
  });

  it('sums only budget payments, in cents', () => {
    const rows = [
      { tipo: 'adelanto', monto: 100.1 },
      { tipo: 'cobro', monto: '0.2' },
      { tipo: 'descuento', monto: 50 },
      { tipo: 'extra_asistencia', monto: 999 },
    ];
    expect(budgetPaid(rows)).toBe(150.3);
    expect(budgetPaid([])).toBe(0);
  });

  it('never returns a negative balance', () => {
    expect(saldo(1000, 400)).toBe(600);
    expect(saldo(1000, 1200)).toBe(0);
    expect(saldo(0.3, 0.1)).toBe(0.2);
  });

  it('validates payments against state and balance', () => {
    const job = { estado: 'programado', monto: 1000, paid: 400 };
    expect(paymentError(job, { tipo: 'cobro', monto: 600 })).toBeNull();
    expect(paymentError(job, { tipo: 'cobro', monto: 600.01 })).toMatch(/supera el saldo pendiente \(600\)/);
    expect(paymentError(job, { tipo: 'extra_asistencia', monto: 5000 })).toBeNull();
    expect(paymentError(job, { tipo: 'cobro', monto: 0 })).toBe('El monto debe ser mayor a 0');
    expect(paymentError(job, { tipo: 'regalo', monto: 1 })).toBe('Tipo de cobro no válido: regalo');
    const cancelled = { ...job, estado: 'cancelado' };
    expect(paymentError(cancelled, { tipo: 'cobro', monto: 10 })).toBe('No se registran cobros en un trabajo cancelado');
    expect(paymentError(cancelled, { tipo: 'descuento', monto: 600 })).toBeNull();
  });

  it('turns a legacy advance into a payment only when no budget payment exists', () => {
    expect(legacyAdvance(500, [])).toBe(500);
    expect(legacyAdvance(500, [{ tipo: 'extra_asistencia', monto: 10 }])).toBe(500);
    expect(legacyAdvance(500, [{ tipo: 'adelanto', monto: 500 }])).toBe(0);
    expect(legacyAdvance(0, [])).toBe(0);
  });

  it('keeps the official amount of a project from a quotation', () => {
    expect(montoChangeError({ quotationId: 'q1', monto: 1000 }, 1000)).toBeNull();
    expect(montoChangeError({ quotationId: 'q1', monto: 1000 }, undefined)).toBeNull();
    expect(montoChangeError({ quotationId: 'q1', monto: 1000 }, 1200)).toMatch(/no se modifica/);
    expect(montoChangeError({ quotationId: null, monto: 1000 }, 1200)).toBeNull();
  });

  it('maps an edited advance to a payment or rejects it', () => {
    expect(adelantoChange(0, false, undefined)).toEqual({ ok: true, payment: 0 });
    expect(adelantoChange(200, true, 200)).toEqual({ ok: true, payment: 0 });
    expect(adelantoChange(0, false, 300)).toEqual({ ok: true, payment: 300 });
    expect(adelantoChange(200, true, 300).ok).toBe(false);
    expect(adelantoChange(200, false, 100).ok).toBe(false);
  });

  it('keeps the division of a job that comes from a quotation', () => {
    expect(categoryChangeError({ quotationId: 'q1', categoriaId: 'seguridad_electronica' }, 'cableado_estructurado')).toMatch(/cotización/);
    expect(categoryChangeError({ quotationId: 'q1', categoriaId: 'seguridad_electronica' }, 'seguridad_electronica')).toBeNull();
    expect(categoryChangeError({ quotationId: null, categoriaId: 'seguridad_electronica' }, 'cableado_estructurado')).toBeNull();
  });
});
