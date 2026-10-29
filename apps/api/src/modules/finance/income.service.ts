import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { isAdmin, isConta, isTec, isVentas } from '../../common/policy/roles';
import { IncomeDto } from './dto/finance.dto';
import { QR_DESTINOS, incomeConceptError, incomeError, incomeOf, movementError, qrDestinationError } from './domain/finance.rules';
import { MOVEMENT_DETAIL, presentMovement } from './movement.presenter';
import { businessToday } from '../../common/domain/calendar';

const DAY_MS = 24 * 60 * 60 * 1000;

type IncomeRef = { projectId?: string; scheduleId?: string; relevamientoId?: string };

const COUNTED_SELECT = { tipo: true, concepto: true, monto: true, estado: true } as const;

type Target = {
  projectId: string | null;
  scheduleId: string | null;
  relevamientoId: string | null;
  clienteId: string;
  sucursalId: string;
  monto: number;
  cobrado: number;
  cancelled: boolean;
  closed: boolean;
  technicians: (string | null)[];
};

/**
 * Payments of a project, a stand-alone job or a visit, checked against what is still owed (a visit owes nothing
 * beforehand: it is charged as "asistencia"). Projects, jobs and visits call this; it reads their amount and state
 * (read-only) so the money rule lives in one place.
 */
@Injectable()
export class IncomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** A job of a project pays into the project; a stand-alone job owes its own amount; a visit owes nothing. */
  private async target(ref: IncomeRef): Promise<Target> {
    if (ref.relevamientoId) {
      const visit = await this.prisma.relevamiento.findUnique({ where: { id: ref.relevamientoId } });
      if (!visit) throw new NotFoundException('Visita no encontrada');
      const sucursalId = visit.sucursalId ?? (await this.prisma.client.findUnique({ where: { id: visit.clienteId }, select: { sucursalId: true } }))?.sucursalId;
      if (!sucursalId) throw new BadRequestException('La visita no tiene sucursal');
      return {
        projectId: null,
        scheduleId: null,
        relevamientoId: visit.id,
        clienteId: visit.clienteId,
        sucursalId,
        monto: 0,
        cobrado: 0,
        cancelled: visit.estado === 'cancelado',
        closed: false,
        technicians: [visit.tecnicoId, visit.usuarioId],
      };
    }
    if (ref.scheduleId) {
      const job = await this.prisma.schedule.findUnique({ where: { id: ref.scheduleId } });
      if (!job) throw new NotFoundException('Trabajo no encontrado');
      if (job.projectId) return { ...(await this.target({ projectId: job.projectId })), scheduleId: job.id };
      const movements = await this.prisma.cashMovement.findMany({ where: { scheduleId: job.id, projectId: null }, select: COUNTED_SELECT });
      return {
        projectId: null,
        scheduleId: job.id,
        relevamientoId: null,
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
      relevamientoId: null,
      clienteId: project.clienteId,
      sucursalId: project.sucursalId,
      monto: Number(project.montoOficial),
      cobrado: incomeOf(movements).cobrado,
      cancelled: project.estado === 'anulado',
      closed: project.estado === 'cerrado',
      technicians: project.schedules.map((s) => s.tecnicoId),
    };
  }

  /**
   * Registered as `por_validar`; Gerencia or Contabilidad validate it into a cash box (rendición). `recibidoPorId` is who
   * holds the money until then (default: who registers it; a técnico only for himself).
   */
  async register(ref: IncomeRef, dto: IncomeDto, user: User, sessionId?: string) {
    const target = await this.target(ref);
    const allowed = isAdmin(user) || isVentas(user) || (isTec(user) && target.technicians.includes(user.id));
    if (!allowed) throw new ForbiddenException('Solo registras cobros de tus trabajos');
    const error =
      movementError({ tipo: 'ingreso', concepto: dto.concepto, monto: dto.monto }) ||
      incomeConceptError(target.relevamientoId ? 'visita' : 'trabajo', dto.concepto) ||
      incomeError(target, dto.concepto, dto.monto) ||
      qrDestinationError(dto.metodo, dto.cuentaDestino);
    if (error) throw new BadRequestException(error);
    const recibidoPorId = dto.recibidoPorId || user.id;
    if (recibidoPorId !== user.id) {
      if (isTec(user)) throw new ForbiddenException('Registra solo el dinero que recibiste tú');
      const person = await this.prisma.user.findUnique({ where: { id: recibidoPorId }, select: { active: true } });
      if (!person?.active) throw new BadRequestException('La persona que recibió el dinero no existe o está inactiva');
    }
    // QR into a company account: it is already in that box (validation confirms it) and nobody holds it. QR into the
    // collector's own account: he holds it until he hands it over (listed in Anticipos, due the next day).
    const qrBox = dto.cuentaDestino ? QR_DESTINOS[dto.cuentaDestino] : undefined;
    const personal = dto.cuentaDestino === 'qr_personal';
    const row = await this.prisma.cashMovement.create({
      data: {
        tipo: 'ingreso',
        concepto: dto.concepto,
        monto: dto.monto,
        metodo: (dto.metodo || '').toLowerCase(),
        ...(qrBox ? { cajaId: qrBox } : {}),
        ...(personal ? { asunto: 'Cobro por QR personal: entregar a la empresa', fechaLimite: new Date(Date.parse(`${businessToday(new Date())}T12:00:00Z`) + DAY_MS) } : {}),
        nota: dto.nota || '',
        projectId: target.projectId,
        scheduleId: target.scheduleId,
        relevamientoId: target.relevamientoId,
        clienteId: target.clienteId,
        sucursalId: target.sucursalId,
        registradoPorId: user.id,
        recibidoPorId: qrBox ? null : recibidoPorId,
      },
      include: MOVEMENT_DETAIL,
    });
    await this.audit.record({
      user,
      sessionId,
      action: 'movement.income',
      entity: 'movement',
      id: row.id,
      affects: [...(target.projectId ? ['project'] : []), ...(target.scheduleId ? ['schedule'] : []), ...(target.relevamientoId ? ['relevamiento'] : []), 'client'],
      patch: { concepto: dto.concepto, monto: dto.monto },
    });
    return presentMovement(row);
  }
}
