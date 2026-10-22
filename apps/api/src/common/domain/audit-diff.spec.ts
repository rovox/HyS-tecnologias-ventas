import { fieldChanges } from './audit-diff';

describe('fieldChanges', () => {
  it('lists only the fields that changed, with before and after', () => {
    expect(fieldChanges({ estado: 'borrador', titulo: 'A' }, { estado: 'enviado', titulo: 'A' })).toEqual({
      estado: { antes: 'borrador', despues: 'enviado' },
    });
  });

  it('compares dates and decimals by value and ignores timestamps', () => {
    const d = new Date('2026-10-22T00:00:00Z');
    const decimal = (n: string) => ({ toFixed: () => n, toString: () => n });
    expect(
      fieldChanges(
        { fecha: d, monto: decimal('10.00'), updatedAt: d },
        { fecha: new Date(d), monto: decimal('12.00'), updatedAt: new Date() },
      ),
    ).toEqual({ monto: { antes: '10.00', despues: '12.00' } });
  });

  it('skips relations', () => {
    expect(fieldChanges({ cliente: { id: 'a' }, sellers: [] }, { cliente: { id: 'b' }, sellers: [1] })).toEqual({});
  });

  it('is empty without both versions', () => {
    expect(fieldChanges(null, { a: 1 })).toEqual({});
  });
});
