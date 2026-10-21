import { checkTransition, deliveryFields, itemTotal, nextStates, pedidoTotal } from './pedidos-internos';

describe('pedidos-internos domain', () => {
  it('lists the next states of each state', () => {
    expect(nextStates('solicitado')).toEqual(['aprobado', 'rechazado', 'cancelado']);
    expect(nextStates('entregado')).toEqual([]);
    expect(nextStates('desconocido')).toEqual([]);
  });

  it('allows only transitions in the flow', () => {
    expect(checkTransition('solicitado', 'aprobado')).toEqual({ ok: true });
    expect(checkTransition('listo_para_entrega', 'entregado')).toEqual({ ok: true });
    expect(checkTransition('solicitado', 'entregado')).toEqual({ ok: false, reason: 'Transición no permitida: solicitado → entregado' });
    expect(checkTransition('cancelado', 'aprobado').ok).toBe(false);
    expect(checkTransition('solicitado', 'perdido')).toEqual({ ok: false, reason: 'Estado desconocido: perdido' });
  });

  it('computes item and order totals in cents', () => {
    expect(itemTotal({ cantidad: 3, costoUnitario: 10.5 })).toBe(31.5);
    expect(itemTotal({ cantidad: 2, costoUnitario: null })).toBe(0);
    expect(pedidoTotal([{ cantidad: 0.1, costoUnitario: 0.2 }, { cantidad: 0.2, costoUnitario: 0.1 }])).toBe(0.04);
    expect(pedidoTotal([])).toBe(0);
  });

  it('sets delivery fields only for entregado', () => {
    const now = new Date('2026-10-21T12:00:00Z');
    expect(deliveryFields('aprobado', {}, 'u1', now)).toEqual({});
    expect(deliveryFields('entregado', {}, 'u1', now)).toEqual({ fechaEntregaReal: now, entregadoPorId: 'u1' });
    expect(deliveryFields('entregado', { fechaEntrega: '2026-10-20', entregadoPorId: 'u2' }, 'u1', now)).toEqual({
      fechaEntregaReal: new Date('2026-10-20'),
      entregadoPorId: 'u2',
    });
  });
});
