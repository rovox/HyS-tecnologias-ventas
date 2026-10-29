import { closeError, closeRequirements, countError, countTotal, differenceMovement, expectedCash, otherMethods, reviewError } from './cash-close.rules';

const mv = (id: string, tipo: string, monto: number, extra = {}) => ({ id, tipo, concepto: 'x', monto, estado: 'validado', metodo: 'efectivo', ...extra });

describe('daily cash close (FIN-04)', () => {
  it('counts notes and coins and refuses unknown or negative ones', () => {
    expect(countTotal({ '200': 2, '100': 1, '10': 3, '0.5': 3, '0.1': 4 })).toBe(531.9);
    expect(countError({ '200': 2, '0.5': 1 })).toBeNull();
    expect(countError({ '300': 1 })).toMatch(/no válida/);
    expect(countError({ '100': -1 })).toMatch(/entero/);
    expect(countError({ '100': 1.5 })).toMatch(/entero/);
  });

  it('expects the opening cash plus cash in (not what a técnico still holds), minus cash the company paid, with transfers of this box', () => {
    const moves = [
      mv('venta', 'ingreso', 150, { medioPago: 'efectivo', cajaId: 'chica' }),
      mv('qr', 'ingreso', 16, { medioPago: 'qr', cajaId: 'caja_qr' }),
      mv('cobro', 'ingreso', 200, { estado: 'por_validar', cajaId: null, recibidoPorId: 'cajero' }),
      mv('tecnico', 'ingreso', 80, { estado: 'por_validar', cajaId: null, recibidoPorId: 'marcos' }),
      mv('gasto', 'egreso', 30, { pagadoPor: 'empresa' }),
      mv('empleado', 'egreso', 40, { pagadoPor: 'empleado' }),
      mv('anulado', 'ingreso', 999, { estado: 'anulado' }),
      mv('deposito', 'transferencia', 100, { cajaId: 'chica', cajaDestinoId: 'banco' }),
      mv('otra', 'ingreso', 50, { cajaId: 'caja_central' }),
    ];
    const r = expectedCash(500, moves, 'chica', new Set(['cajero']));
    expect(r).toMatchObject({ ingresos: 350, egresos: 130, esperado: 720 });
    expect(r.lines.map((l) => l.id)).toEqual(['venta', 'cobro', 'gasto', 'deposito']);
    expect(otherMethods(moves)).toEqual({ qr: 16, transferencia: 0 });
  });

  it('asks the reason of a difference and turns it into a movement to validate', () => {
    expect(closeError(0)).toBeNull();
    expect(closeError(-12.5)).toMatch(/faltante/);
    expect(closeError(3, 'Cambio de más')).toBeNull();
    expect(differenceMovement(-12.5)).toEqual({ tipo: 'egreso', concepto: 'diferencia_arqueo', monto: 12.5, label: 'Faltante' });
    expect(differenceMovement(3)).toMatchObject({ tipo: 'ingreso', label: 'Sobrante' });
    expect(differenceMovement(0)).toBeNull();
  });

  it('lists what a day needs before closing: arrived, not closed, earlier days closed in order (LAUNCH P1-2)', () => {
    const ok = closeRequirements({ dia: '2026-10-28', today: '2026-10-29', closed: false, pendingDay: null });
    expect(ok.every((r) => r.ok)).toBe(true);
    const future = closeRequirements({ dia: '2026-10-30', today: '2026-10-29', closed: false, pendingDay: null });
    expect(future.find((r) => !r.ok)?.texto).toMatch(/todavía no llegó/);
    const late = closeRequirements({ dia: '2026-10-29', today: '2026-10-29', closed: false, pendingDay: '2026-10-27' });
    expect(late.filter((r) => !r.ok).map((r) => r.texto)).toEqual(['Falta cerrar el 2026-10-27: los días con movimientos se cierran en orden']);
    expect(closeRequirements({ dia: '2026-10-29', today: '2026-10-29', closed: true, pendingDay: null }).find((r) => !r.ok)?.texto).toBe('Este día ya está cerrado');
  });

  it('a close is approved or observed with a reason; an approved one is final (LAUNCH P1-3)', () => {
    expect(reviewError(null, 'aprobar')).toBeNull();
    expect(reviewError(null, 'observar', ' ')).toMatch(/qué hay que revisar/);
    expect(reviewError('observado', 'aprobar')).toBeNull();
    expect(reviewError('aprobado', 'observar', 'x')).toBe('Este cierre ya está aprobado');
  });
});
