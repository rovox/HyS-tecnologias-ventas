import { BadRequestException } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { ROLES } from '../auth/roles';

describe('SchedulesService', () => {
  const prisma = {
    schedule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    client: { findUnique: jest.fn() },
    sucursal: { findUnique: jest.fn() },
    quotation: { findUnique: jest.fn() },
    touchClientActivity: jest.fn(),
  };
  const activity = { log: jest.fn() };
  const service = new SchedulesService(prisma as never, activity as never);

  const admin = {
    id: 'usr_admin',
    role: ROLES.ADMIN,
    sucursalId: 'suc_central',
  } as never;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects invalid status transition', async () => {
    prisma.schedule.findFirst.mockResolvedValue({
      id: 'sch_1',
      estado: 'terminado',
      monto: 100,
      adelanto: 0,
      clienteId: 'cli_1',
    });
    await expect(
      service.update('sch_1', { estado: 'programado' }, admin),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates schedule and touches client activity', async () => {
    prisma.client.findUnique.mockResolvedValue({ id: 'cli_1', direccion: 'X' });
    prisma.sucursal.findUnique.mockResolvedValue({ id: 'suc_central' });
    prisma.schedule.create.mockResolvedValue({ id: 'sch_new', clienteId: 'cli_1' });
    const row = await service.create(
      {
        type: 'seguridad',
        clienteId: 'cli_1',
        descripcionTrabajo: 'Instalación',
        sucursalId: 'suc_central',
        fechaProgramada: '2026-08-22',
        monto: 1000,
        adelanto: 200,
      },
      admin,
      'sess_1',
    );
    expect(row.id).toBe('sch_new');
    expect(prisma.touchClientActivity).toHaveBeenCalledWith('cli_1');
    expect(activity.log).toHaveBeenCalled();
  });
});
