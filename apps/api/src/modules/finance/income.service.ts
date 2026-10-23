import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { isAdmin, isTec, isVentas } from '../../common/policy/roles';
import { IncomeDto } from './dto/finance.dto';
import { incomeError, incomeOf, movementError } from './domain/finance.rules';
import { MOVEMENT_DETAIL, presentMovement } from './movement.presenter';

const COUNTED_SELECT = { tipo: true, concepto: true, monto: true, estado: true } as const;

type Target = {
  projectId: string | null;
  scheduleId: string | null;
  clienteId: string;
  sucursalId: string;
  monto: number;
  cobrado: number;
  cancelled: boolean;
  closed: boolean;
  technicians: (string | null)[];
};

/**
 * Payments of a project or of a stand-alone job, checked against what is still owed. Projects and jobs call this;
 * it reads their amount and state (read-only) so the money rule lives in one place.
 */
@Injectable()
export class IncomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** A job of a project pays into the project; a stand-alone job owes its own amount. */
  private async target(ref: { projectId?: string; scheduleId?: string }): Promise<Target> {
    if (ref.scheduleId) {
      const job = await this.prisma.schedule.findUnique({ where: { id: ref.scheduleId } });
      if (!job) throw new NotFoundException('Trabajo no encontrado');
      if (job.projectId) return { ...(await this.target({ projectId: job.projectId })), scheduleId: job.id };
      const movements = await this.prisma.cashMovement.findMany({ where: { scheduleId: job.id, projectId: null }, select: COUNTED_SELECT });
      return {
        projectId: null,
        scheduleId: job.id,
        clienteId: job.clienteId,
        sucursalId: job.sucursalId,
        monto: Number(job.monto),
        cobrado: incomeOf(movements).cobrado,
        cancelled: job.estado === 'cancelado',
        closed: false,
        technicians: [job.tecnicoId],
      };
    }
    const project = await this.prisma.project.findUnique({
      where: { id: ref.projectId },
      include: { schedules: { select: { tecnicoId: true } } },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    const movements = await this.prisma.cashMovement.findMany({ where: { projectId: project.id }, select: COUNTED_SELECT });
    return {
      projectId: project.id,
      scheduleId: null,
      clienteId: project.clienteId,
      sucursalId: project.sucursalId,
      monto: Number(project.montoOficial),
      cobrado: incomeOf(movements).cobrado,
      cancelled: project.estado === 'anulado',
      closed: project.estado === 'cerrado',
      technicians: project.schedules.map((s) => s.tecnicoId),
    };
  }

  /** Registered as `por_validar`; Gerencia validates it into a cash box (rendición). */
  async register(ref: { projectId?: string; scheduleId?: string }, dto: IncomeDto, user: User, sessionId?: string) {
    const target = await this.target(ref);
    const allowed = isAdmin(user) || isVentas(user) || (isTec(user) && target.technicians.includes(user.id));
    if (!allowed) throw new ForbiddenException('Solo registras cobros de tus trabajos');
    const error =
      movementError({ tipo: 'ingreso', concepto: dto.concepto, monto: dto.monto }) ||
      incomeError(target, dto.concepto, dto.monto);
    if (error) throw new BadRequestException(error);
    const row = await this.prisma.cashMovement.create({
      data: {
        tipo: 'ingreso',
        concepto: dto.concepto,
        monto: dto.monto,
        metodo: dto.metodo || '',
        nota: dto.nota || '',
        projectId: target.projectId,
        scheduleId: target.scheduleId,
        clienteId: target.clienteId,
        sucursalId: target.sucursalId,
        registradoPorId: user.id,
      },
      include: MOVEMENT_DETAIL,
    });
    await this.audit.record({
      user,
      sessionId,
      action: 'movement.income',
      entity: 'movement',
      id: row.id,
      affects: [...(target.projectId ? ['project'] : []), ...(target.scheduleId ? ['schedule'] : []), 'client'],
      patch: { concepto: dto.concepto, monto: dto.monto },
    });
    return presentMovement(row);
  }
}
