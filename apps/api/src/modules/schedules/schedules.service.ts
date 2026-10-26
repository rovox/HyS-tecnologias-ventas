import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  assertCanCreateSchedules,
  assertCanMutateSchedules,
  isAdmin,
  isTec,
  scheduleWhere,
} from '../../common/policy/roles';
import { CreateScheduleDto, CreateSchedulePaymentDto, ScheduleStatusDto, UpdateScheduleDto } from './dto/schedule.dto';
import { AuditService } from '../../common/audit/audit.service';
import { categoryChangeError, checkScheduleTransition, montoChangeError } from './domain/schedules.rules';
import { CategoriesService } from '../categories';
import { IncomeService, balanceOf, incomeOf } from '../finance';

type Tx = Prisma.TransactionClient;

const include = {
  cliente: true,
  sucursal: true,
  vendedor: { select: { id: true, name: true } },
  tecnico: { select: { id: true, name: true } },
  quotation: { select: { id: true, numero: true, titulo: true, monto: true } },
  categoria: { select: { id: true, label: true } },
  project: { select: { id: true, codigo: true, estado: true } },
  movements: {
    where: { tipo: 'ingreso' },
    select: { id: true, concepto: true, monto: true, estado: true, metodo: true, nota: true, fecha: true, tipo: true },
    orderBy: { fecha: 'desc' },
  },
} satisfies Prisma.ScheduleInclude;

type ScheduleRow = Prisma.ScheduleGetPayload<{ include: typeof include }>;

/**
 * A stand-alone job owes its own amount, computed from the ledger; a job of a project carries no money (the project
 * does). `adelanto` and `saldo` keep their names for the cronograma screens.
 */
function present(row: ScheduleRow) {
  const { movements, ...job } = row;
  const cobrado = row.projectId ? 0 : incomeOf(movements).cobrado;
  return { ...job, adelanto: cobrado, saldo: row.projectId ? 0 : balanceOf(Number(row.monto), cobrado, row.estado === 'cancelado'), movements };
}

/** Jobs of a project move the project's lists and totals too. */
const affectsOf = (row: { projectId?: string | null }, base: string[] = []) => (row.projectId ? [...base, 'project'] : base);

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly categories: CategoriesService,
    private readonly income: IncomeService,
  ) {}

  list(
    user: User,
    filters: {
      estado?: string;
      sucursalId?: string;
      from?: string;
      to?: string;
      tecnicoId?: string;
      quotationId?: string;
      clienteId?: string;
    } = {},
  ) {
    return this.prisma.schedule.findMany({
      where: {
        ...scheduleWhere(user),
        ...(filters.estado ? { estado: filters.estado } : {}),
        ...(filters.sucursalId ? { sucursalId: filters.sucursalId } : {}),
        ...(filters.tecnicoId ? { tecnicoId: filters.tecnicoId } : {}),
        ...(filters.quotationId ? { quotationId: filters.quotationId } : {}),
        ...(filters.clienteId ? { clienteId: filters.clienteId } : {}),
        ...(filters.from || filters.to
          ? {
              fechaProgramada: {
                ...(filters.from ? { gte: new Date(filters.from) } : {}),
                ...(filters.to ? { lte: new Date(filters.to) } : {}),
              },
            }
          : {}),
      },
      include,
      orderBy: { fechaProgramada: 'asc' },
    }).then((rows) => rows.map(present));
  }

  async get(id: string, user: User) {
    const row = await this.prisma.schedule.findFirst({
      where: { id, ...scheduleWhere(user) },
      include,
    });
    if (!row) throw new NotFoundException('Trabajo no encontrado');
    return present(row);
  }

  /** `projectId` is set by the projects module when it adds a job to a project. */
  async create(dto: CreateScheduleDto, user: User, sessionId?: string, options: { projectId?: string } = {}) {
    assertCanCreateSchedules(user);
    const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
    if (!client) throw new BadRequestException('Cliente no encontrado');
    const sucursal = await this.prisma.sucursal.findUnique({ where: { id: dto.sucursalId } });
    if (!sucursal) throw new BadRequestException('Sucursal no válida');
    // A job from a quotation has the quotation's division; any other job needs one of the 3 divisions.
    let categoriaId = dto.categoriaId;
    if (dto.quotationId) {
      const quote = await this.prisma.quotation.findUnique({ where: { id: dto.quotationId } });
      if (!quote) throw new BadRequestException('Cotización no encontrada');
      categoriaId = quote.categoriaId;
    } else {
      await this.categories.assertDivision(categoriaId);
    }
    const monto = Number(dto.monto ?? 0);
    const adelanto = Number(dto.adelanto ?? 0);
    const row = await this.prisma.schedule.create({
      data: {
        categoriaId: categoriaId!,
        clienteId: dto.clienteId,
        lugar: dto.lugar || client.direccion || '',
        descripcionTrabajo: dto.descripcionTrabajo.trim(),
        monto,
        fechaProgramada: new Date(dto.fechaProgramada),
        horario: dto.horario || null,
        estado: dto.estado || 'programado',
        sucursalId: dto.sucursalId,
        vendedorId: dto.vendedorId || (user.role.includes('VENTAS') ? user.id : null),
        tecnicoId: dto.tecnicoId || null,
        quotationId: dto.quotationId || null,
        projectId: options.projectId || null,
        observaciones: dto.observaciones || '',
        mapsLink: dto.mapsLink || '',
      },
      include,
    });
    // An advance given when the job is created is its first payment (projects take payments on the project).
    if (adelanto > 0 && !options.projectId) await this.income.register({ scheduleId: row.id }, { concepto: 'adelanto', monto: adelanto, nota: 'Adelanto al crear el trabajo' }, user, sessionId);
    await this.prisma.touchClientActivity(dto.clienteId);
    await this.audit.record({
      user,
      sessionId,
      action: 'schedule.create',
      entity: 'schedule',
      id: row.id,
      affects: affectsOf(row),
      patch: { estado: row.estado },
    });
    return this.get(row.id, user);
  }

  async update(id: string, dto: UpdateScheduleDto, user: User, sessionId?: string) {
    assertCanMutateSchedules(user);
    const current = await this.get(id, user);
    if (isTec(user) && !isAdmin(user)) {
      const keys = Object.keys(dto).filter((k) => (dto as Record<string, unknown>)[k] !== undefined);
      if (keys.some((k) => !['estado', 'observaciones', 'fechaFinalizacion', 'horario'].includes(k))) {
        throw new ForbiddenException('Técnico solo actualiza estado u observaciones');
      }
    }
    if (dto.estado && dto.estado !== current.estado) {
      const transition = checkScheduleTransition(current.estado, dto.estado);
      if (!transition.ok) throw new BadRequestException(transition.reason);
    }
    const montoError = montoChangeError(current, dto.monto);
    if (montoError) throw new BadRequestException(montoError);
    const categoryError = categoryChangeError(current, dto.categoriaId);
    if (categoryError) throw new BadRequestException(categoryError);
    if (dto.categoriaId !== undefined && dto.categoriaId !== current.categoriaId) await this.categories.assertDivision(dto.categoriaId);
    if (dto.adelanto !== undefined && Number(dto.adelanto) !== Number(current.adelanto)) {
      throw new BadRequestException('Registra el adelanto como un cobro del trabajo');
    }
    const row = await this.prisma.schedule
      .update({
        where: { id },
        data: {
          ...(dto.categoriaId !== undefined ? { categoriaId: dto.categoriaId } : {}),
          ...(dto.lugar !== undefined ? { lugar: dto.lugar } : {}),
          ...(dto.descripcionTrabajo ? { descripcionTrabajo: dto.descripcionTrabajo.trim() } : {}),
          ...(dto.monto !== undefined ? { monto: Number(dto.monto) } : {}),
          ...(dto.fechaProgramada ? { fechaProgramada: new Date(dto.fechaProgramada) } : {}),
          ...(dto.horario !== undefined ? { horario: dto.horario || null } : {}),
          ...(dto.vendedorId !== undefined ? { vendedorId: dto.vendedorId || null } : {}),
          ...(dto.tecnicoId !== undefined ? { tecnicoId: dto.tecnicoId || null } : {}),
          ...(dto.observaciones !== undefined ? { observaciones: dto.observaciones } : {}),
          ...(dto.mapsLink !== undefined ? { mapsLink: dto.mapsLink } : {}),
          ...(dto.estado ? { estado: dto.estado } : {}),
          ...(dto.estado === 'terminado' || dto.fechaFinalizacion
            ? { fechaFinalizacion: dto.fechaFinalizacion ? new Date(dto.fechaFinalizacion) : new Date() }
            : {}),
        },
        include,
      })
      .then(present);
    await this.prisma.touchClientActivity(current.clienteId);
    await this.audit.record({
      user,
      sessionId,
      action: dto.estado ? 'schedule.status' : 'schedule.update',
      entity: 'schedule',
      id,
      before: current,
      after: row,
      affects: affectsOf(row),
      patch: { estado: row.estado, saldo: row.saldo },
    });
    return row;
  }

  async updateStatus(id: string, dto: ScheduleStatusDto, user: User, sessionId?: string) {
    return this.update(id, { estado: dto.estado, fechaFinalizacion: dto.fechaFinalizacion }, user, sessionId);
  }

  /** Payments of the job as the cronograma screens read them (`tipo`, `at`), from the ledger. */
  async listPayments(scheduleId: string, user: User) {
    const job = await this.get(scheduleId, user);
    return job.movements.map((m) => ({
      id: m.id,
      tipo: m.concepto === 'adicional' ? 'extra_asistencia' : m.concepto,
      monto: m.monto,
      metodo: m.metodo,
      nota: m.nota,
      estado: m.estado,
      at: m.fecha,
    }));
  }

  /** A payment taken on a job: booked in the ledger on the job, or on its project when it belongs to one. */
  async registerPayment(scheduleId: string, dto: CreateSchedulePaymentDto, user: User, sessionId?: string) {
    assertCanMutateSchedules(user);
    await this.get(scheduleId, user);
    const concepto = dto.tipo === 'extra_asistencia' ? 'adicional' : dto.tipo;
    await this.income.register({ scheduleId }, { concepto, monto: Number(dto.monto), metodo: dto.metodo, nota: dto.nota, recibidoPorId: dto.recibidoPorId }, user, sessionId);
    return this.get(scheduleId, user);
  }

  /** First job of a project, created inside the transaction that approves the quotation. */
  createFirstJob(tx: Tx, data: Prisma.ScheduleUncheckedCreateInput) {
    return tx.schedule.create({ data });
  }

  /** A cancelled project cancels its jobs that have not finished. */
  cancelOpenJobs(tx: Tx, projectId: string) {
    return tx.schedule.updateMany({
      where: { projectId, estado: { in: ['programado', 'en_proceso'] } },
      data: { estado: 'cancelado' },
    });
  }
}
