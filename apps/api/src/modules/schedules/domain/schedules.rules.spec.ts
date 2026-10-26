import {
  categoryChangeError,
  checkScheduleTransition,
  montoChangeError,
} from './schedules.rules';

describe('schedules domain', () => {
  it('allows only transitions in the flow', () => {
    expect(checkScheduleTransition('programado', 'en_proceso')).toEqual({ ok: true });
    expect(checkScheduleTransition('en_proceso', 'terminado')).toEqual({ ok: true });
    expect(checkScheduleTransition('terminado', 'programado')).toEqual({ ok: false, reason: 'Transición inválida: terminado → programado' });
    expect(checkScheduleTransition('programado', 'perdido')).toEqual({ ok: false, reason: 'Estado desconocido: perdido' });
  });

  it('gives no amount of their own to the jobs of a project', () => {
    expect(montoChangeError({ projectId: 'p1', monto: 0 }, 500)).toMatch(/proyecto/);
    expect(montoChangeError({ projectId: 'p1', monto: 0 }, 0)).toBeNull();
    expect(montoChangeError({ projectId: null, monto: 100 }, 500)).toBeNull();
  });

  it('keeps the division of a job that comes from a quotation', () => {
    expect(categoryChangeError({ quotationId: 'q1', categoriaId: 'seguridad_electronica' }, 'cableado_estructurado')).toMatch(/cotización/);
    expect(categoryChangeError({ quotationId: 'q1', categoriaId: 'seguridad_electronica' }, 'seguridad_electronica')).toBeNull();
    expect(categoryChangeError({ quotationId: null, categoriaId: 'seguridad_electronica' }, 'cableado_estructurado')).toBeNull();
  });
});
