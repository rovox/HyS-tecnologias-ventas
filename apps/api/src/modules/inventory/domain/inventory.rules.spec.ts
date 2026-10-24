import { isLowStock, materialCost, movementsForDelivery, stockBySede, stockMovementError, totalStock } from './inventory.rules';

const ctx = { productTipo: 'material', available: 10, isAdmin: false };

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
    expect(stockMovementError({ ...adj, motivo: '' }, { ...ctx, isAdmin: true })).toMatch(/motivo/);
    expect(stockMovementError({ ...adj, sucursalDestinoId: 'p' }, { ...ctx, isAdmin: true })).toMatch(/sobrante/);
    expect(stockMovementError(adj, { ...ctx, isAdmin: true })).toBeNull();
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
});
