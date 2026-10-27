import { renderSaleNote, saleNoteDefinition } from './sale-note';

const sale = {
  numero: 445,
  fecha: new Date('2026-09-02T18:30:00Z'),
  sucursal: { nombre: 'Central', direccion: 'C. México N° 290 esq. España, Cochabamba' },
  vendedor: { name: 'Denis Palacios', phone: '72243471' },
  clienteNombre: 'Jose Ticona',
  clienteCelular: '67415760',
  clienteNit: '6741760-JOSE TICONA',
  subtotal: 430,
  descuento: 0,
  total: 430,
  items: [{ codigo: 'IC-BF-A58', descripcion: 'Radio portable VHF/UHF', unidad: 'unidad', cantidad: 1, precioUnitario: 430, descuento: 0, subtotal: 430 }],
  cobros: [{ medioPago: 'transferencia', monto: 430 }],
};
const text = (def: unknown) => JSON.stringify(def);

describe('sale note (VD-03)', () => {
  it('carries the number, branch, cashier, client, amount in words, payments and the CANCELADO stamp', () => {
    const def = text(saleNoteDefinition(sale));
    for (const piece of ['NOTA DE VENTA', 'NRO: NV-0445', 'C. México N° 290 esq. España', 'NIT 4416960', 'DENIS PALACIOS', '72243471', 'JOSE TICONA', '6741760-JOSE TICONA', 'CUATROCIENTOS TREINTA 00/100 BOLIVIANOS', 'TRANSFERENCIA BANCARIA', 'CANCELADO', 'Entregué conforme', 'Vo. Bo.', 'Documento no fiscal']) {
      expect(def).toContain(piece);
    }
    expect(def).not.toContain('ANULADA');
  });

  it('marks an annulled copy with its reason and renders a real PDF', async () => {
    const def = saleNoteDefinition({ ...sale, motivoAnulacion: 'Precio mal cargado' }, { annulled: true });
    expect(text(def)).toContain('ANULADA');
    expect(text(def)).toContain('Precio mal cargado');
    expect(text(def)).not.toContain('CANCELADO');
    const pdf = await renderSaleNote(sale);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });
});
