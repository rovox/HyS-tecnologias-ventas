import { clientStatus } from './clients.report';

describe('client report', () => {
  it('has a service in course while a project or job is open or something is owed', () => {
    expect(clientStatus([], []).servicioEnCurso).toBe(false);
    expect(clientStatus([{ estado: 'cerrado', monto: 1000, cobrado: 1000, saldo: 0 }], []).servicioEnCurso).toBe(false);
    expect(clientStatus([{ estado: 'en_ejecucion', monto: 1000, cobrado: 0, saldo: 1000 }], []).servicioEnCurso).toBe(true);
    expect(clientStatus([], [{ estado: 'terminado', monto: 300, saldo: 100 }]).servicioEnCurso).toBe(true);
    expect(clientStatus([], [{ estado: 'programado', monto: 0, saldo: 0 }]).servicioEnCurso).toBe(true);
  });

  it('adds what is owed and what was contracted (cancelled work does not count)', () => {
    const status = clientStatus(
      [
        { estado: 'entregado', monto: '2500', cobrado: 1000, saldo: 1500 },
        { estado: 'anulado', monto: 9000, cobrado: 0, saldo: 0 },
      ],
      [
        { estado: 'terminado', monto: 300, saldo: 50.5 },
        { estado: 'cancelado', monto: 400, saldo: 0 },
      ],
    );
    expect(status).toEqual({ saldoPendiente: 1550.5, proyectosEnCurso: 1, trabajosEnCurso: 0, totalContratado: 2800, servicioEnCurso: true });
  });
});
