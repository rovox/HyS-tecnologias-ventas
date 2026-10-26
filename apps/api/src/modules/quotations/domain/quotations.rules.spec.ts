import {
  acceptError,
  checkQuotationTransition,
  deleteError,
  editError,
  expiresAt,
  isExpired,
  nextStates,
  restoreError,
  vistaFilter,
} from './quotations.rules';

const deleted = new Date('2026-10-01');

describe('quotations rules', () => {
  it('follows the flow, needs the PDF to send and a reason to reject', () => {
    expect(checkQuotationTransition({ estado: 'borrador', archivoPdfUrl: 'x.pdf' }, 'enviado')).toEqual({ ok: true });
    expect(checkQuotationTransition({ estado: 'borrador' }, 'enviado')).toEqual({ ok: false, reason: 'Adjunta el PDF antes de enviar la cotización' });
    expect(checkQuotationTransition({ estado: 'borrador' }, 'aprobado').ok).toBe(false);
    expect(checkQuotationTransition({ estado: 'enviado' }, 'rechazado')).toEqual({ ok: false, reason: 'Indica el motivo del rechazo' });
    expect(checkQuotationTransition({ estado: 'enviado' }, 'rechazado', { motivo: 'Precio' })).toEqual({ ok: true });
    expect(checkQuotationTransition({ estado: 'enviado' }, 'vencido').ok).toBe(false);
  });

  it('never leaves aprobado (the project is cancelled instead)', () => {
    expect(nextStates({ estado: 'aprobado' })).toEqual([]);
    expect(checkQuotationTransition({ estado: 'aprobado' }, 'rechazado', { motivo: 'x' }).ok).toBe(false);
  });

  it('reopens rejected and expired quotations, and approves an expired one', () => {
    expect(nextStates({ estado: 'rechazado' })).toEqual(['borrador']);
    expect(nextStates({ estado: 'vencido' })).toEqual(['aprobado', 'borrador']);
  });

  it('blocks every change on a deleted quotation until restored', () => {
    expect(nextStates({ estado: 'borrador', eliminadaAt: deleted })).toEqual([]);
    expect(checkQuotationTransition({ estado: 'enviado', eliminadaAt: deleted }, 'aprobado').ok).toBe(false);
    expect(editError({ estado: 'borrador', eliminadaAt: deleted }, { titulo: 'x' })).toMatch(/Restaura/);
    expect(acceptError({ estado: 'enviado', clienteId: 'c', eliminadaAt: deleted })).toMatch(/Restaura/);
  });

  it('approves sent or expired quotations with a client', () => {
    expect(acceptError({ estado: 'enviado', clienteId: 'c1' })).toBeNull();
    expect(acceptError({ estado: 'vencido', clienteId: 'c1' })).toBeNull();
    expect(acceptError({ estado: 'aprobado', clienteId: 'c1' })).toBeNull();
    expect(acceptError({ estado: 'borrador', clienteId: 'c1' })).toBe('Solo se aprueba una cotización enviada');
    expect(acceptError({ estado: 'rechazado', clienteId: 'c1' })).toMatch(/reábrela/);
    expect(acceptError({ estado: 'enviado', clienteId: null })).toMatch(/Asigna un cliente/);
  });

  it('expires a sent quotation after 15 days', () => {
    const sent = new Date('2026-10-01T12:00:00Z');
    expect(expiresAt(sent)).toEqual(new Date('2026-10-16T12:00:00Z'));
    expect(isExpired({ estado: 'enviado', fechaEnvio: sent }, new Date('2026-10-16T11:00:00Z'))).toBe(false);
    expect(isExpired({ estado: 'enviado', fechaEnvio: sent }, new Date('2026-10-16T13:00:00Z'))).toBe(true);
    expect(isExpired({ estado: 'borrador', fechaEnvio: sent }, new Date('2026-12-01'))).toBe(false);
  });

  it('deletes (hides) with a reason anything but an approved quotation, and restores it', () => {
    expect(deleteError({ estado: 'borrador' }, 'Duplicada')).toBeNull();
    expect(deleteError({ estado: 'borrador' }, ' ')).toMatch(/motivo/);
    expect(deleteError({ estado: 'aprobado' }, 'x')).toMatch(/cancela su proyecto/);
    expect(deleteError({ estado: 'rechazado', eliminadaAt: deleted }, 'x')).toMatch(/ya está eliminada/);
    expect(restoreError({ estado: 'rechazado', eliminadaAt: deleted })).toBeNull();
    expect(restoreError({ estado: 'rechazado' })).toMatch(/no está eliminada/);
  });

  it('keeps amount, client and division fixed once approved', () => {
    expect(editError({ estado: 'enviado' }, { monto: 10 })).toBeNull();
    expect(editError({ estado: 'aprobado' }, { titulo: 'Nuevo' })).toBeNull();
    expect(editError({ estado: 'aprobado' }, { monto: 10 })).toMatch(/proyecto/);
    expect(editError({ estado: 'aprobado' }, { categoriaId: 'x' })).toMatch(/proyecto/);
  });

  it('splits open and closed views', () => {
    expect(vistaFilter('abiertas')).toEqual({ estados: ['borrador', 'enviado'], eliminadas: false });
    expect(vistaFilter('cerradas')).toEqual({ estados: ['aprobado', 'rechazado', 'vencido'], eliminadas: null });
    expect(vistaFilter()).toBeNull();
  });
});
