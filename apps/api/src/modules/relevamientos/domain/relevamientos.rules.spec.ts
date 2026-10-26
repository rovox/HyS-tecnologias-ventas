import { checkVisitTransition, inWarranty, isClosed, nextVisitStates, visitPayments, warrantyUntil } from './relevamientos.rules';

const day = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe('relevamientos.rules', () => {
  it('follows the visit flow; resolved and cancelled are final', () => {
    expect(nextVisitStates('programado')).toContain('en_camino');
    expect(nextVisitStates('resuelto')).toEqual([]);
    expect(checkVisitTransition('programado', 'resuelto', { fotos: 3 })).toEqual({ ok: false, reason: 'Transición no permitida: programado → resuelto' });
    expect(checkVisitTransition('pendiente', 'en_atencion', { fotos: 0 })).toEqual({ ok: true });
    expect(isClosed('cancelado')).toBe(true);
    expect(isClosed('pendiente')).toBe(false);
  });

  it('needs a photo to resolve and a reason to cancel', () => {
    expect(checkVisitTransition('en_atencion', 'resuelto', { fotos: 0 })).toMatchObject({ ok: false });
    expect(checkVisitTransition('en_atencion', 'resuelto', { fotos: 1 })).toEqual({ ok: true });
    expect(checkVisitTransition('programado', 'cancelado', { fotos: 0, motivo: '  ' })).toMatchObject({ ok: false });
    expect(checkVisitTransition('programado', 'cancelado', { fotos: 0, motivo: 'El cliente reprogramó' })).toEqual({ ok: true });
  });

  it('takes the warranty from the delivered project, or 12 months from a finished stand-alone job', () => {
    const project = { estado: 'entregado', entregadoAt: day('2026-01-15'), garantiaMeses: 6 };
    expect(warrantyUntil({ estado: 'terminado', fechaProgramada: day('2026-01-10'), project })).toEqual(day('2026-07-15'));
    expect(warrantyUntil({ estado: 'terminado', fechaProgramada: day('2026-01-10'), project: { ...project, entregadoAt: null } })).toBeNull();
    expect(warrantyUntil({ estado: 'terminado', fechaProgramada: day('2026-01-10'), fechaFinalizacion: day('2026-01-12') })).toEqual(day('2027-01-12'));
    expect(warrantyUntil({ estado: 'programado', fechaProgramada: day('2026-01-10') })).toBeNull();
  });

  it('checks the visit date against the warranty', () => {
    expect(inWarranty(day('2026-07-15'), day('2026-07-15'))).toBe(true);
    expect(inWarranty(day('2026-07-15'), day('2026-07-16'))).toBe(false);
    expect(inWarranty(null, day('2026-07-16'))).toBeNull();
  });

  it('adds the money taken on a visit; observed and annulled payments do not count', () => {
    const rows = [
      { monto: 150, estado: 'por_validar' },
      { monto: '100.50', estado: 'validado' },
      { monto: 80, estado: 'observado' },
      { monto: 60, estado: 'anulado' },
    ];
    expect(visitPayments(rows)).toEqual({ cobrado: 250.5, porRendir: 150 });
  });
});
