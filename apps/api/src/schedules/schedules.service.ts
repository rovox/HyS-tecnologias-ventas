import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import {
  assertCanCreateSchedules,
  assertCanMutateSchedules,
  isAdmin,
  isTec,
  scheduleWhere,
} from '../auth/roles';
import { CreateScheduleDto, CreateSchedulePaymentDto, ScheduleStatusDto, UpdateScheduleDto } from './dto/schedule.dto';
import { RealtimeService } from '../realtime/realtime.service';

const FLOW: Record<string, string[]> = {
  programado: ['en_proceso', 'cancelado'],
  en_proceso: ['terminado', 'cancelado'],
  terminado: [],
  cancelado: [],
};

const BUDGET_TIPOS = new Set(['adelanto', 'cobro']);

const include = {
  cliente: true,
  sucursal: true,
  vendedor: { select: { id: true, name: true } },
  tecnico: { select: { id: true, name: true } },
  quotation: { select: { id: true, numero: true, titulo: true, monto: true } },
  payments: true,
} as const;

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly realtime: RealtimeService,
  ) {}

  private saldo(monto: number, cobradoPresupuesto: number) {
    return Math.max(0, Number(monto) - Number(cobradoPresupuesto));
  }

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
    });
  }

  async get(id: string, user: User) {
    const row = await this.prisma.schedule.findFirst({
      where: { id, ...scheduleWhere(user) },
      include,
    });
    if (!row) throw new NotFoundException('Trabajo no encontrado');
    return row;
  }

  async create(dto: CreateScheduleDto, user: User, sessionId?: string) {
    assertCanCreateSchedules(user);
    const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
    if (!client) throw new BadRequestException('Cliente no encontrado');
    const sucursal = await this.prisma.sucursal.findUnique({ where: { id: dto.sucursalId } });
    if (!sucursal) throw new BadRequestException('Sucursal no válida');
    if (dto.quotationId) {
      const quote = await this.prisma.quotation.findUnique({ where: { id: dto.quotationId } });
      if (!quote) throw new BadRequestException('Cotización no encontrada');
    }
    const monto = Number(dto.monto ?? 0);
    const adelanto = Number(dto.adelanto ?? 0);
    const row = await this.prisma.schedule.create({
      data: {
        type: dto.type,
        clienteId: dto.clienteId,
        lugar: dto.lugar || client.direccion || '',
        descripcionTrabajo: dto.descripcionTrabajo.trim(),
        monto,
        adelanto,
        saldo: this.saldo(monto, adelanto),
        fechaProgramada: new Date(dto.fechaProgramada),
        horario: dto.horario || null,
        estado: dto.estado || 'programado',
        sucursalId: dto.sucursalId,
        vendedorId: dto.vendedorId || (user.role.includes('VENTAS') ? user.id : null),
        tecnicoId: dto.tecnicoId || null,
        quotationId: dto.quotationId || null,
        observaciones: dto.observaciones || '',
        mapsLink: dto.mapsLink || '',
        ...(adelanto > 0
          ? {
              payments: {
                create: {
                  tipo: 'adelanto',
                  monto: adelanto,
                  metodo: '',
                  nota: 'Adelanto al crear trabajo',
                  cobradoPorId: user.id,
                  quotationId: dto.quotationId || null,
                },
              },
            }
          : {}),
      },
      include,
    });
    await this.prisma.touchClientActivity(dto.clienteId);
    await this.activity.log(user.id, sessionId, 'schedule.create', 'schedule', row.id);
    this.realtime.emit('schedule.created', 'schedule', row.id, {
      byUserId: user.id,
      patch: { estado: row.estado, saldo: Number(row.saldo) },
    });
    return row;
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
      const allowed = FLOW[current.estado] || [];
      if (!allowed.includes(dto.estado)) {
        throw new BadRequestException(`Transición inválida: ${current.estado} → ${dto.estado}`);
      }
    }
    const monto = dto.monto !== undefined ? Number(dto.monto) : Number(current.monto);
    let adelanto = dto.adelanto !== undefined ? Number(dto.adelanto) : Number(current.adelanto);
    const budgetPaid = await this.budgetPaid(id, adelanto);
    const row = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.lugar !== undefined ? { lugar: dto.lugar } : {}),
        ...(dto.descripcionTrabajo ? { descripcionTrabajo: dto.descripcionTrabajo.trim() } : {}),
        ...(dto.monto !== undefined ? { monto } : {}),
        ...(dto.adelanto !== undefined ? { adelanto } : {}),
        ...(dto.monto !== undefined || dto.adelanto !== undefined
          ? { saldo: this.saldo(monto, budgetPaid) }
          : {}),
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
    });
    await this.prisma.touchClientActivity(current.clienteId);
    await this.activity.log(user.id, sessionId, 'schedule.update', 'schedule', id);
    this.realtime.emit(dto.estado ? 'schedule.status' : 'schedule.updated', 'schedule', id, {
      byUserId: user.id,
      patch: { estado: row.estado, saldo: Number(row.saldo), adelanto: Number(row.adelanto) },
    });
    return row;
  }

  async updateStatus(id: string, dto: ScheduleStatusDto, user: User, sessionId?: string) {
    return this.update(id, { estado: dto.estado, fechaFinalizacion: dto.fechaFinalizacion }, user, sessionId);
  }

  listPayments(scheduleId: string, user: User) {
    return this.get(scheduleId, user).then((row) => row.payments || []);
  }

  async registerPayment(scheduleId: string, dto: CreateSchedulePaymentDto, user: User, sessionId?: string) {
    assertCanMutateSchedules(user);
    const schedule = await this.get(scheduleId, user);
    const payment = await this.prisma.schedulePayment.create({
      data: {
        scheduleId,
        relevamientoId: dto.relevamientoId || null,
        quotationId: dto.quotationId || schedule.quotationId || null,
        tipo: dto.tipo,
        monto: Number(dto.monto),
        metodo: dto.metodo || '',
        nota: dto.nota || '',
        cobradoPorId: user.id,
      },
    });
    if (BUDGET_TIPOS.has(dto.tipo)) {
      const paid = await this.budgetPaid(scheduleId);
      await this.prisma.schedule.update({
        where: { id: scheduleId },
        data: {
          adelanto: paid,
          saldo: this.saldo(Number(schedule.monto), paid),
        },
      });
    }
    await this.activity.log(user.id, sessionId, 'schedule.payment', 'schedule', scheduleId);
    this.realtime.emit('payment.created', 'payment', payment.id, {
      byUserId: user.id,
      patch: { scheduleId, tipo: dto.tipo, monto: Number(dto.monto) },
    });
    return this.get(scheduleId, user);
  }

  private async budgetPaid(scheduleId: string, fallbackAdelanto?: number) {
    const rows = await this.prisma.schedulePayment.findMany({
      where: { scheduleId, tipo: { in: [...BUDGET_TIPOS] } },
    });
    if (!rows.length && fallbackAdelanto !== undefined) return Number(fallbackAdelanto);
    return rows.reduce((sum, r) => sum + Number(r.monto), 0);
  }
}
