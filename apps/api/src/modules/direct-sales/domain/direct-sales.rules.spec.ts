import { annulError, boxForPayment, canSellFromBranch, saleError, saleNumber, saleTotals } from './direct-sales.rules';

describe('direct sales rules (VD-01)', () => {
  const line = (productoId: string, cantidad: number, precioUnitario: number, descuento = 0) => ({ productoId, cantidad, precioUnitario, descuento });

  it('adds lines, line discounts and the sale discount', () => {
    expect(saleTotals([line('a', 2, 100, 10), line('b', 1, 30.5)], 20)).toMatchObject({ subtotal: 220.5, descuento: 20, total: 200.5 });
  });

  it('refuses no lines, missing stock, a discount above the amount and payments that do not add up', () => {
    const stock = { a: 5 };
    expect(saleError([], 0, [], stock)).toMatch(/al menos un producto/);
    expect(saleError([line('a', 6, 10)], 0, [{ medio: 'efectivo', monto: 60 }], stock)).toMatch(/Stock insuficiente/);
    expect(saleError([line('a', 3, 10), line('a', 3, 10)], 0, [{ medio: 'efectivo', monto: 60 }], stock)).toMatch(/Stock insuficiente/);
    expect(saleError([line('a', 1, 10, 11)], 0, [{ medio: 'efectivo', monto: 0.01 }], stock)).toMatch(/descuento de una línea/);
    expect(saleError([line('a', 1, 166)], 0, [{ medio: 'efectivo', monto: 150 }], stock)).toMatch(/no suman el total/);
    expect(saleError([line('a', 1, 166)], 0, [{ medio: 'tarjeta', monto: 166 }], stock)).toMatch(/Medio de pago/);
    expect(saleError([line('a', 1, 166)], 0, [{ medio: 'efectivo', monto: 150 }, { medio: 'qr', monto: 16 }], stock)).toBeNull();
  });

  it('lets a seller sell from his branch or Central; Gerencia from any', () => {
    const seller = { manager: false, seller: true, sucursalId: 'suc_punata' };
    expect(canSellFromBranch(seller, 'suc_punata')).toBe(true);
    expect(canSellFromBranch(seller, 'suc_central')).toBe(true);
    expect(canSellFromBranch(seller, 'suc_quillacollo')).toBe(false);
    expect(canSellFromBranch({ manager: true, seller: false }, 'suc_quillacollo')).toBe(true);
    expect(canSellFromBranch({ manager: false, seller: false, sucursalId: 'suc_punata' }, 'suc_punata')).toBe(false);
  });

  it('sends each payment to the box of its method, never to a default one', () => {
    const boxes = [
      { id: 'caja_central', tipo: 'caja', sucursalId: 'suc_central', active: true },
      { id: 'caja_chica_punata', tipo: 'caja_chica', sucursalId: 'suc_punata', active: true },
      { id: 'caja_qr_socia', tipo: 'qr', sucursalId: 'suc_central', active: true },
      { id: 'caja_qr', tipo: 'qr', sucursalId: 'suc_central', active: true },
      { id: 'caja_banco', tipo: 'banco', sucursalId: 'suc_central', active: true },
    ];
    expect(boxForPayment('efectivo', 'suc_punata', boxes)).toBe('caja_chica_punata');
    expect(boxForPayment('efectivo', 'suc_central', boxes)).toBe('caja_central');
    expect(boxForPayment('qr', 'suc_punata', boxes)).toBe('caja_qr');
    expect(boxForPayment('transferencia', 'suc_punata', boxes)).toBe('caja_banco');
    expect(boxForPayment('efectivo', 'suc_quillacollo', boxes)).toBeNull();
  });

  it('numbers notes and annuls only once with a reason', () => {
    expect(saleNumber(445)).toBe('NV-0445');
    expect(annulError({ estado: 'registrada' }, ' ')).toMatch(/motivo/);
    expect(annulError({ estado: 'anulada' }, 'x')).toMatch(/ya está anulada/);
    expect(annulError({ estado: 'registrada' }, 'Precio mal cargado')).toBeNull();
  });
});
