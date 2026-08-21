import { ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ROLES } from '../auth/roles';

describe('TasksService', () => {
  const prisma = {
    task: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const activity = { log: jest.fn() };
  const service = new TasksService(prisma as never, activity as never);

  const cont = { id: 'usr_conta', role: ROLES.CONT, sucursalId: 'suc_central' } as never;
  const ventas = { id: 'usr_ventas', role: ROLES.VENTAS, sucursalId: 'suc_central' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('blocks contadora from listing tasks', async () => {
    await expect(service.list(cont)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates task with optional empty links', async () => {
    prisma.task.create.mockResolvedValue({ id: 't1' });
    prisma.task.findFirst.mockResolvedValue({
      id: 't1',
      titulo: 'Demo',
      estado: 'pendiente',
      prioridad: 'media',
      creadorId: 'usr_ventas',
    });
    const row = await service.create(
      { titulo: 'Demo', plazo: undefined, horario: undefined, cotizacionId: undefined },
      ventas,
      'sess',
    );
    expect(row.id).toBe('t1');
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: 'Demo',
          cotizacionId: null,
          scheduleId: null,
        }),
      }),
    );
  });
});
