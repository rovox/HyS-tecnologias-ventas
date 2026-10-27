import { archivedAtFor, compareTasks, convertError, isOverdue, pendingSummary, purgeBefore } from './tasks.rules';

const now = new Date('2026-10-23T14:00:00Z'); // 10:00 in Bolivia
const base = { estado: 'pendiente', prioridad: 'media', creadorId: 'u1', asignadoId: null as string | null, plazo: null as string | null };

describe('tasks rules', () => {
  it('is overdue only when pending and the due day has passed', () => {
    expect(isOverdue({ estado: 'pendiente', plazo: '2026-10-22' }, now)).toBe(true);
    expect(isOverdue({ estado: 'pendiente', plazo: '2026-10-23' }, now)).toBe(false);
    expect(isOverdue({ estado: 'completada', plazo: '2026-10-01' }, now)).toBe(false);
    expect(isOverdue({ estado: 'pendiente', plazo: null }, now)).toBe(false);
  });

  it('sorts urgent first, then by due date', () => {
    const rows = [
      { ...base, prioridad: 'baja', plazo: '2026-10-24' },
      { ...base, prioridad: 'alta', plazo: null },
      { ...base, prioridad: 'media', plazo: '2026-10-25' },
      { ...base, prioridad: 'media', plazo: '2026-10-24' },
    ];
    expect([...rows].sort(compareTasks).map((r) => `${r.prioridad}${r.plazo ?? ''}`)).toEqual([
      'alta',
      'media2026-10-24',
      'media2026-10-25',
      'baja2026-10-24',
    ]);
  });

  it('counts the pending tasks I am in charge of, the ones nobody is in charge of and my overdue ones', () => {
    const tasks = [
      { ...base, asignadoId: 'u1', plazo: '2026-10-20' },
      { ...base, creadorId: 'u1' },
      { ...base, creadorId: 'u2' },
      { ...base, asignadoId: 'u2' },
      { ...base, asignadoId: 'u1', estado: 'completada' },
    ];
    expect(pendingSummary(tasks, 'u1', now)).toEqual({ mias: 1, sinAsignar: 2, vencidas: 1 });
  });

  it('converts a pending task once', () => {
    expect(convertError({ estado: 'pendiente' })).toBeNull();
    expect(convertError({ estado: 'pendiente', cotizacionId: 'q1' })).toMatch(/ya tiene/);
    expect(convertError({ estado: 'completada' })).toMatch(/pendiente/);
  });

  it('archives closed tasks and purges them after 30 days (TSK-03)', () => {
    const now = new Date('2026-10-27T12:00:00Z');
    expect(archivedAtFor('completada', now)).toBe(now);
    expect(archivedAtFor('descartada', now)).toBe(now);
    expect(archivedAtFor('pendiente', now)).toBeNull();
    expect(purgeBefore(now).toISOString()).toBe('2026-09-27T12:00:00.000Z');
  });
});
