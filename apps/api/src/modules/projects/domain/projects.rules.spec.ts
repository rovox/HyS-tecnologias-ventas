import {
  checkProjectTransition,
  firstJobFromQuotation,
  montoChangeError,
  newJobError,
  nextProjectStates,
  projectCode,
  warranty,
} from './projects.rules';

const ctx = { saldo: 0, isAdmin: false, motivo: null as string | null };

describe('projects rules', () => {
  it('follows planificado → en_ejecucion → entregado → cerrado', () => {
    expect(nextProjectStates({ estado: 'planificado' })).toEqual(['en_ejecucion', 'anulado']);
    expect(checkProjectTransition({ estado: 'planificado' }, 'en_ejecucion', ctx)).toEqual({ ok: true });
    expect(checkProjectTransition({ estado: 'planificado' }, 'cerrado', ctx).ok).toBe(false);
    expect(nextProjectStates({ estado: 'cerrado' })).toEqual([]);
  });

  it('delivers only when every job is finished or cancelled', () => {
    expect(checkProjectTransition({ estado: 'en_ejecucion' }, 'entregado', { ...ctx, openJobs: 2 })).toEqual({
      ok: false,
      reason: 'Termina o cancela los trabajos pendientes antes de entregar (2)',
    });
    expect(checkProjectTransition({ estado: 'en_ejecucion' }, 'entregado', { ...ctx, openJobs: 0 })).toEqual({ ok: true });
  });

  it('closes only with nothing owed', () => {
    expect(checkProjectTransition({ estado: 'entregado' }, 'cerrado', { ...ctx, saldo: 150 })).toEqual({
      ok: false,
      reason: 'No se cierra un proyecto con saldo pendiente (Bs 150)',
    });
    expect(checkProjectTransition({ estado: 'entregado' }, 'cerrado', ctx)).toEqual({ ok: true });
  });

  it('is cancelled only by Gerencia with a reason', () => {
    expect(checkProjectTransition({ estado: 'en_ejecucion' }, 'anulado', { ...ctx, motivo: 'x' }).ok).toBe(false);
    expect(checkProjectTransition({ estado: 'en_ejecucion' }, 'anulado', { ...ctx, isAdmin: true }).ok).toBe(false);
    expect(checkProjectTransition({ estado: 'en_ejecucion' }, 'anulado', { ...ctx, isAdmin: true, motivo: 'Cliente desistió' })).toEqual({ ok: true });
  });

  it('runs the warranty from the delivery date', () => {
    const now = new Date('2026-10-23T00:00:00Z');
    expect(warranty(null, 12, now)).toEqual({ hasta: null, vigente: false });
    expect(warranty('2026-01-15T00:00:00Z', 12, now)).toEqual({ hasta: new Date('2027-01-15T00:00:00Z'), vigente: true });
    expect(warranty('2025-01-15T00:00:00Z', 6, now).vigente).toBe(false);
  });

  it('lets only Gerencia change the official amount, with a reason', () => {
    expect(montoChangeError({ isAdmin: false, estado: 'planificado' }, 100, 'x')).toMatch(/Gerencia/);
    expect(montoChangeError({ isAdmin: true, estado: 'planificado' }, 100, '')).toMatch(/motivo/);
    expect(montoChangeError({ isAdmin: true, estado: 'cerrado' }, 100, 'x')).toMatch(/cerrado/);
    expect(montoChangeError({ isAdmin: true, estado: 'en_ejecucion' }, 100, 'Ampliación')).toBeNull();
  });

  it('adds jobs only to open projects and derives the code', () => {
    expect(newJobError({ estado: 'anulado' })).toMatch(/cerrado o anulado/);
    expect(newJobError({ estado: 'entregado' })).toBeNull();
    expect(projectCode('COT-102326-2')).toBe('PRY-102326-2');
  });

  it('builds the first job with the division and no money of its own', () => {
    const now = new Date('2026-10-21T00:00:00Z');
    const quote = { id: 'q1', numero: 'COT-1', titulo: 'CCTV', categoriaId: 'seguridad_electronica', monto: 1500, clienteId: 'c1', sucursalId: 's1', vendedorId: 'v1' };
    expect(firstJobFromQuotation(quote, 'Av. Siempre Viva', {}, now)).toMatchObject({
      categoriaId: 'seguridad_electronica',
      lugar: 'Av. Siempre Viva',
      descripcionTrabajo: 'CCTV (COT-1)',
      monto: 0,
      fechaProgramada: now,
      estado: 'programado',
      quotationId: 'q1',
      vendedorId: 'v1',
    });
    expect(firstJobFromQuotation(quote, '', { lugar: ' Obra ', fechaProgramada: '2026-11-01' }, now)).toMatchObject({
      lugar: 'Obra',
      fechaProgramada: new Date('2026-11-01'),
    });
    expect(firstJobFromQuotation(quote, '', {}, now).lugar).toBe('Por definir');
  });
});
