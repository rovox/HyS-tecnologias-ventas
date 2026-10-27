import { ledgerRows, ledgerSummary } from './ledger-export.rules';

const m = (tipo: string, concepto: string, monto: number, estado = 'validado', extra = {}) => ({ fecha: '2026-10-28T02:30:00.000Z', tipo, concepto, monto, estado, ...extra });

describe('ledger export (FIN-06)', () => {
  it('writes one row per movement in plain words, on the Bolivian day and time', () => {
    const [row] = ledgerRows([m('egreso', 'viaticos', 80, 'por_validar', { caja: null, sucursal: { nombre: 'Central' }, registradoPor: { name: 'Denis' }, nota: 'Viaje' })]);
    expect(row).toMatchObject({ fecha: '2026-10-27', hora: '22:30', tipo: 'Egreso', concepto: 'Viáticos', monto: -80, estado: 'Por validar', sucursal: 'Central', registro: 'Denis', nota: 'Viaje' });
    const [transfer] = ledgerRows([m('transferencia', 'deposito', 50, 'validado', { caja: { nombre: 'Caja chica' }, cajaDestino: { nombre: 'Banco' } })]);
    expect(transfer).toMatchObject({ monto: 50, caja: 'Caja chica → Banco' });
    const [held] = ledgerRows([m('ingreso', 'cobro', 100, 'por_validar', { recibidoPor: { name: 'Marcos' } })]);
    expect(held.tieneDinero).toBe('Marcos');
  });

  it('sums incomes, expenses, net and what waits, without annulled movements or transfers', () => {
    const summary = ledgerSummary([
      m('ingreso', 'cobro', 300),
      m('ingreso', 'adelanto', 100, 'por_validar'),
      m('egreso', 'material', 120.5),
      m('egreso', 'material', 999, 'anulado'),
      m('transferencia', 'deposito', 50),
    ]);
    expect(summary).toEqual({
      ingresos: 400,
      egresos: 120.5,
      neto: 279.5,
      porValidar: { cantidad: 1, monto: 100 },
      anulados: 1,
      porConcepto: [
        { concepto: 'Adelanto', monto: 100 },
        { concepto: 'Cobro', monto: 300 },
        { concepto: 'Material', monto: -120.5 },
      ],
    });
  });
});
