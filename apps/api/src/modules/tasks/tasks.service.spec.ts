import { ConflictException, ForbiddenException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ROLES } from '../../common/policy/roles';

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
  const realtime = { emit: jest.fn() };
  const service = new TasksService(prisma as never, activity as never, realtime as never);

  const tecnico = { id: 'usr_tecnico', role: ROLES.TEC, sucursalId: 'suc_central' } as never;
  const ventas = { id: 'usr_ventas', role: ROLES.VENTAS, sucursalId: 'suc_central' } as never;

  beforeEach(() => jest.clearAllMocks());

  it('blocks técnico from claiming a task', async () => {
    await expect(service.claim('t1', tecnico, 'sess')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.task.findFirst).not.toHaveBeenCalled();
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
          tipo: 'operativa',
        }),
      }),
    );
  });

  it('rejects claim when already assigned', async () => {
    prisma.task.findFirst.mockResolvedValue({
      id: 't1',
      asignadoId: 'usr_other',
      creadorId: 'usr_ventas',
    });
    await expect(service.claim('t1', ventas, 'sess')).rejects.toBeInstanceOf(ConflictException);
  });
});
