import { branchMoveError, isLowStock, kardex, materialCost, movementsForDelivery, stockBySede, stockMovementError, totalStock } from './inventory.rules';

const ctx = { productTipo: 'material', available: 10, canAdjust: false };

describe('inventory rules', () => {
  it('computes stock per branch from the movements', () => {
    const stock = stockBySede([
      { cantidad: 20, sucursalDestinoId: 'central' },
      { cantidad: '5', sucursalOrigenId: 'central', sucursalDestinoId: 'punata' },
      { cantidad: 3, sucursalOrigenId: 'central' },
      { cantidad: 1.5, sucursalOrigenId: 'punata' },
    ]);
    expect(stock).toEqual({ central: 12, punata: 3.5 });
    expect(totalStock(stock)).toBe(15.5);
  });

  it('flags low stock of products, never of services', () => {
    expect(isLowStock({ tipo: 'material', stockMinimo: 10 }, 10)).toBe(true);
    expect(isLowStock({ tipo: 'material', stockMinimo: 10 }, 11)).toBe(false);
    expect(isLowStock({ tipo: 'servicio', stockMinimo: 10 }, 0)).toBe(false);
    expect(isLowStock({ tipo: 'equipo', stockMinimo: 0 }, 0)).toBe(false);
  });

  it('checks where stock comes from and goes, and never goes below zero', () => {
    expect(stockMovementError({ tipo: 'entrada', cantidad: 5, sucursalDestinoId: 'c' }, ctx)).toBeNull();
    expect(stockMovementError({ tipo: 'entrada', cantidad: 5 }, ctx)).toMatch(/destino/);
    expect(stockMovementError({ tipo: 'transferencia', cantidad: 5, sucursalOrigenId: 'c', sucursalDestinoId: 'c' }, ctx)).toMatch(/distintas/);
    expect(stockMovementError({ tipo: 'transferencia', cantidad: 11, sucursalOrigenId: 'c', sucursalDestinoId: 'p' }, ctx)).toBe('Stock insuficiente: hay 10 disponible(s)');
    expect(stockMovementError({ tipo: 'salida_proyecto', cantidad: 2, sucursalOrigenId: 'c' }, ctx)).toMatch(/proyecto/);
    expect(stockMovementError({ tipo: 'entrada', cantidad: 0, sucursalDestinoId: 'c' }, ctx)).toMatch(/mayor a 0/);
    expect(stockMovementError({ tipo: 'entrada', cantidad: 1, sucursalDestinoId: 'c' }, { ...ctx, productTipo: 'servicio' })).toMatch(/servicio/);
  });

  it('lets only Gerencia adjust, with a reason and a single direction', () => {
    const adj = { tipo: 'ajuste', cantidad: 2, sucursalOrigenId: 'c', motivo: 'Faltante en conteo' };
    expect(stockMovementError(adj, ctx)).toMatch(/Gerencia/);
    expect(stockMovementError({ ...adj, motivo: '' }, { ...ctx, canAdjust: true })).toMatch(/motivo/);
    expect(stockMovementError({ ...adj, sucursalDestinoId: 'p' }, { ...ctx, canAdjust: true })).toMatch(/sobrante/);
    expect(stockMovementError(adj, { ...ctx, canAdjust: true })).toBeNull();
  });

  it('turns a delivered order into transfers (branch order) or project outputs (job order)', () => {
    const items = [{ productoId: 'p1', cantidad: 3, materialNombre: 'Cable' }, { productoId: null, cantidad: 1, materialNombre: 'Texto libre' }];
    expect(movementsForDelivery({ sucursalOrigenId: 'c', sucursalDestinoId: 'p' }, items)).toEqual([
      { productoId: 'p1', tipo: 'transferencia', cantidad: 3, sucursalOrigenId: 'c', sucursalDestinoId: 'p', projectId: null },
    ]);
    expect(movementsForDelivery({ sucursalOrigenId: 'c', projectId: 'pr1' }, items)).toEqual([
      { productoId: 'p1', tipo: 'salida_proyecto', cantidad: 3, sucursalOrigenId: 'c', sucursalDestinoId: null, projectId: 'pr1' },
    ]);
    expect(movementsForDelivery({ sucursalDestinoId: 'p' }, items)).toMatch(/origen/);
    expect(movementsForDelivery({ sucursalOrigenId: 'c', forJob: true }, items)).toMatch(/no es de un proyecto/);
    expect(movementsForDelivery({}, [{ productoId: null, cantidad: 1, materialNombre: 'x' }])).toEqual([]);
  });

  it('values the material that left to a project', () => {
    expect(materialCost([{ tipo: 'salida_proyecto', cantidad: 3, costoUnitario: '4.50' }, { tipo: 'entrada', cantidad: 9, costoUnitario: 1 }])).toBe(13.5);
  });

  it('removes material (baja) from a branch, with a reason, never below zero (INV-03)', () => {
    expect(stockMovementError({ tipo: 'baja', cantidad: 2, sucursalOrigenId: 'punata', motivo: 'Dañado' }, ctx)).toBeNull();
    expect(stockMovementError({ tipo: 'baja', cantidad: 2, sucursalOrigenId: 'punata' }, ctx)).toMatch(/por qué/);
    expect(stockMovementError({ tipo: 'baja', cantidad: 2, sucursalDestinoId: 'punata', motivo: 'x' }, ctx)).toMatch(/sucursal de la que sale/);
    expect(stockMovementError({ tipo: 'baja', cantidad: 20, sucursalOrigenId: 'punata', motivo: 'x' }, ctx)).toMatch(/Stock insuficiente/);
  });

  it('a seller buys into Central, moves from his branch or Central and removes only from his branch (INV-03)', () => {
    const seller = { manager: false, sucursalId: 'suc_punata' };
    expect(branchMoveError({ tipo: 'entrada', sucursalDestinoId: 'suc_central' }, seller)).toBeNull();
    expect(branchMoveError({ tipo: 'entrada', sucursalDestinoId: 'suc_punata' }, seller)).toMatch(/Central/);
    expect(branchMoveError({ tipo: 'transferencia', sucursalOrigenId: 'suc_central', sucursalDestinoId: 'suc_punata' }, seller)).toBeNull();
    expect(branchMoveError({ tipo: 'transferencia', sucursalOrigenId: 'suc_quillacollo', sucursalDestinoId: 'suc_punata' }, seller)).toMatch(/tu sucursal o desde Central/);
    expect(branchMoveError({ tipo: 'baja', sucursalOrigenId: 'suc_punata' }, seller)).toBeNull();
    expect(branchMoveError({ tipo: 'baja', sucursalOrigenId: 'suc_central' }, seller)).toMatch(/solo de tu sucursal/);
    expect(branchMoveError({ tipo: 'baja', sucursalOrigenId: 'suc_quillacollo' }, { manager: true })).toBeNull();
  });

  it('builds the kardex of a branch or of the company with its running balance (INV-03)', () => {
    const m = (id: string, fecha: string, tipo: string, cantidad: number, from?: string, to?: string) => ({ id, fecha, tipo, cantidad, sucursalOrigenId: from ?? null, sucursalDestinoId: to ?? null });
    const moves = [
      m('3', '2026-10-03', 'salida_venta_directa', 2, 'punata'),
      m('1', '2026-10-01', 'entrada', 10, undefined, 'central'),
      m('2', '2026-10-02', 'transferencia', 4, 'central', 'punata'),
    ];
    expect(kardex(moves, 'punata').map((r) => [r.id, r.entra, r.sale, r.saldo])).toEqual([['2', 4, 0, 4], ['3', 0, 2, 2]]);
    expect(kardex(moves, 'central').map((r) => [r.id, r.saldo])).toEqual([['1', 10], ['2', 6]]);
    expect(kardex(moves).map((r) => [r.id, r.saldo])).toEqual([['1', 10], ['3', 8]]);
  });
});
