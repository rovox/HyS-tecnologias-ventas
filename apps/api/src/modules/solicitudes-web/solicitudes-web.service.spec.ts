import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ROLES } from '../../common/policy/roles';
import { clientTipoFromServicio, SolicitudesWebService } from './solicitudes-web.service';

describe('SolicitudesWebService', () => {
  const prisma = {
    solicitudWeb: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    client: { findFirst: jest.fn(), findUnique: jest.fn() },
  };
  const audit = { record: jest.fn(), log: jest.fn() };
  const clients = { create: jest.fn() };
  const service = new SolicitudesWebService(prisma as never, audit as never, clients as never);

  const ventas = { id: 'usr_ventas', role: ROLES.VENTAS, sucursalId: 'suc_central' } as never;
  const tec = { id: 'usr_tecnico', role: ROLES.TEC, sucursalId: 'suc_central' } as never;
  const base = {
    id: 's1',
    nombre: 'Ana Rojas',
    empresa: 'Cooperativa Demo',
    email: 'ana@demo.bo',
    telefono: '70000000',
    departamento: 'Cochabamba',
    servicio: 'Cableado estructurado',
    detalle: '40 puntos Cat 6A',
    estado: 'nueva',
    clienteId: null,
  };

  beforeEach(() => jest.clearAllMocks());

  it('stores a webhook request and emits a realtime event', async () => {
    prisma.solicitudWeb.create.mockResolvedValue({ id: 's1', estado: 'nueva', servicio: 'Cableado estructurado' });
    const res = await service.createFromWebhook({
      nombre: ' Ana ',
      email: 'ANA@demo.bo',
      detalle: ' 40 puntos ',
      servicio: 'Cableado estructurado',
    });
    expect(res).toEqual({ id: 's1' });
    expect(prisma.solicitudWeb.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ nombre: 'Ana', email: 'ana@demo.bo', detalle: '40 puntos', notas: '' }) }),
    );
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'solicitud_web.created', entity: 'solicitud_web', id: 's1' }),
    );
  });

  it('blocks technicians from listing', async () => {
    expect(() => service.list(tec)).toThrow(ForbiddenException);
  });

  it('rejects an invalid state transition', async () => {
    prisma.solicitudWeb.findUnique.mockResolvedValue({ ...base, estado: 'convertida' });
    await expect(service.update('s1', { estado: 'nueva' }, ventas)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('converts into a new client when there is no match', async () => {
    prisma.solicitudWeb.findUnique.mockResolvedValue(base);
    prisma.client.findFirst.mockResolvedValue(null);
    clients.create.mockResolvedValue({ id: 'cli_new' });
    prisma.solicitudWeb.update.mockResolvedValue({ ...base, estado: 'convertida', clienteId: 'cli_new' });

    const res = await service.convert('s1', ventas, 'sess');

    expect(res.created).toBe(true);
    expect(clients.create).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Cooperativa Demo', contacto: 'Ana Rojas', tipo: 'Proyectos' }),
      ventas,
      'sess',
    );
    expect(prisma.solicitudWeb.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ estado: 'convertida', clienteId: 'cli_new' }) }),
    );
  });

  it('links an existing client instead of duplicating it', async () => {
    prisma.solicitudWeb.findUnique.mockResolvedValue(base);
    prisma.client.findFirst.mockResolvedValue({ id: 'cli_existing' });
    prisma.solicitudWeb.update.mockResolvedValue({ ...base, estado: 'convertida', clienteId: 'cli_existing' });

    const res = await service.convert('s1', ventas);

    expect(res.created).toBe(false);
    expect(clients.create).not.toHaveBeenCalled();
    expect(res.solicitud.clienteId).toBe('cli_existing');
  });

  it('maps the website service to the client category', () => {
    expect(clientTipoFromServicio('Seguridad electrónica')).toBe('Seguridad Electrónica');
    expect(clientTipoFromServicio('Equipos de cómputo y comunicación')).toBe('Equipos y tecnología');
    expect(clientTipoFromServicio('Certificación Fluke / auditoría de red')).toBe('Proyectos');
  });
});
