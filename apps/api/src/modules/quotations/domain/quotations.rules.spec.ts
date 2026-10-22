import { acceptError, checkQuotationTransition, projectFromQuotation } from './quotations.rules';

describe('quotations domain', () => {
  it('allows only transitions in the flow and needs the PDF to send', () => {
    expect(checkQuotationTransition('borrador', 'enviado', true)).toEqual({ ok: true });
    expect(checkQuotationTransition('borrador', 'enviado', false)).toEqual({ ok: false, reason: 'Adjunta el PDF antes de enviar la cotización' });
    expect(checkQuotationTransition('borrador', 'aceptado', true)).toEqual({ ok: false, reason: 'Transición inválida: borrador → aceptado' });
    expect(checkQuotationTransition('enviado', 'vencido', true).ok).toBe(false);
  });

  it('accepts only sent (or already accepted) quotations with a client', () => {
    expect(acceptError({ estado: 'enviado', clienteId: 'c1' })).toBeNull();
    expect(acceptError({ estado: 'aceptado', clienteId: 'c1' })).toBeNull();
    expect(acceptError({ estado: 'borrador', clienteId: 'c1' })).toBe('Solo se acepta una cotización enviada');
    expect(acceptError({ estado: 'rechazado', clienteId: 'c1' })).toBe('Una cotización rechazada no se puede aceptar');
    expect(acceptError({ estado: 'enviado', clienteId: null })).toMatch(/Asigna un cliente/);
  });

  it('builds the project from the quotation total', () => {
    const now = new Date('2026-10-21T00:00:00Z');
    const quote = { id: 'q1', numero: 'COT-1', titulo: 'CCTV', monto: 1500, clienteId: 'c1', sucursalId: 's1', vendedorId: 'v1' };
    const project = projectFromQuotation(quote, 'Av. Siempre Viva', {}, now);
    expect(project).toMatchObject({
      type: 'seguridad',
      lugar: 'Av. Siempre Viva',
      descripcionTrabajo: 'CCTV (COT-1)',
      monto: 1500,
      adelanto: 0,
      saldo: 1500,
      fechaProgramada: now,
      estado: 'programado',
      quotationId: 'q1',
      vendedorId: 'v1',
    });
    expect(projectFromQuotation(quote, '', { type: 'proyectos', lugar: ' Obra ', fechaProgramada: '2026-11-01' }, now)).toMatchObject({
      type: 'proyectos',
      lugar: 'Obra',
      fechaProgramada: new Date('2026-11-01'),
    });
    expect(projectFromQuotation(quote, '', {}, now).lugar).toBe('Por definir');
  });
});
