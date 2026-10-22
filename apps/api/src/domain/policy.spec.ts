import {
  canListUserDirectory,
  canListUsers,
  canManagePedidos,
  canMutateRelevamientos,
  canSeeQuotations,
  canViewUser,
  metricsUserId,
  quotationWhere,
  relevamientoWhere,
  ROLES,
  scheduleWhere,
  taskWhere,
} from './policy';

const admin = { id: 'a', role: ROLES.ADMIN };
const ventas = { id: 'v', role: ROLES.VENTAS };
const tec = { id: 't', role: ROLES.TEC };
const none = { id: 'n', role: ROLES.NONE };

describe('policy', () => {
  it('lets every role with access read the user directory, but only admin/ventas the full list', () => {
    expect([admin, ventas, tec, none].map(canListUserDirectory)).toEqual([true, true, true, false]);
    expect([admin, ventas, tec, none].map(canListUsers)).toEqual([true, true, false, false]);
  });

  it('lets a user view their own profile; admin and ventas view anyone', () => {
    expect(canViewUser(tec, 't')).toBe(true);
    expect(canViewUser(tec, 'v')).toBe(false);
    expect(canViewUser(ventas, 't')).toBe(true);
    expect(canViewUser(admin, 't')).toBe(true);
    expect(canViewUser(none, 'n')).toBe(false);
  });

  it('keeps quotations and internal orders for commercial roles', () => {
    expect([admin, ventas, tec, none].map(canSeeQuotations)).toEqual([true, true, false, false]);
    expect([admin, ventas, tec, none].map(canManagePedidos)).toEqual([true, true, false, false]);
    expect(quotationWhere(tec)).toEqual({ id: '__none__' });
  });

  it('scopes schedules and tasks for técnico to their own rows', () => {
    expect(scheduleWhere(admin)).toEqual({});
    expect(scheduleWhere(tec)).toEqual({ tecnicoId: 't' });
    expect(scheduleWhere(none)).toEqual({ id: '__none__' });
    expect(taskWhere(tec, 'cotizacion')).toEqual({ id: '__none__' });
    expect(taskWhere(tec)).toEqual({ OR: [{ asignadoId: 't' }, { creadorId: 't' }] });
  });

  it('lets every role with access register relevamientos; técnico sees the ones he made or is assigned to', () => {
    expect([admin, ventas, tec, none].map(canMutateRelevamientos)).toEqual([true, true, true, false]);
    expect(relevamientoWhere(tec, 'q1')).toEqual({ cotizacionId: 'q1', OR: [{ usuarioId: 't' }, { tecnicoId: 't' }] });
    expect(relevamientoWhere(none)).toEqual({ id: '__none__' });
  });

  it('lets only admin read another seller metrics', () => {
    expect(metricsUserId(admin, 'v')).toBe('v');
    expect(metricsUserId(ventas, 'a')).toBe('v');
  });
});
