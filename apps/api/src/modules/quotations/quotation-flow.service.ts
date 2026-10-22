import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { assertCanMutateQuotes, quotationWhere } from '../../common/policy/roles';
import { AcceptQuotationDto } from './dto/quotation.dto';
import {
  acceptError,
  checkQuotationTransition,
  deleteError,
  expiryCutoff,
  projectFromQuotation,
  restoreError,
} from './domain/quotations.rules';
import { DETAIL, present } from './quotation.presenter';

const HOUR_MS = 60 * 60 * 1000;

/** Quotation states: send, approve (creates the project), reject, reopen, expire, delete and restore. */
@Injectable()
export class QuotationFlowService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QuotationFlowService.name);
  private expiryTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async row(id: string, user: User) {
    const row = await this.prisma.quotation.findFirst({ where: { id, ...quotationWhere(user) }, include: DETAIL });
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return row;
  }

  private async get(id: string, user: User) {
    return present(await this.row(id, user));
  }

  onModuleInit() {
    const run = () => this.expireOverdue().catch((err) => this.logger.error(`Vencimiento de cotizaciones: ${err}`));
    run();
    this.expiryTimer = setInterval(run, HOUR_MS);
    this.expiryTimer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.expiryTimer);
  }

  /** Sent quotations older than the validity become `vencido` (also checked before every list). */
  async expireOverdue(now = new Date()) {
    const due = await this.prisma.quotation.findMany({
      where: { estado: 'enviado', eliminadaAt: null, fechaEnvio: { lt: expiryCutoff(now) } },
      select: { id: true },
    });
    if (!due.length) return 0;
    await this.prisma.quotation.updateMany({ where: { id: { in: due.map((q) => q.id) } }, data: { estado: 'vencido' } });
    for (const { id } of due) {
      await this.audit.record({ action: 'quotation.expire', entity: 'quotation', id, patch: { estado: 'vencido' } });
    }
    return due.length;
  }

  async updateStatus(id: string, estado: string, user: User, sessionId?: string, motivoRechazo?: string, fechaEnvio?: string) {
    assertCanMutateQuotes(user);
    const current = await this.row(id, user);
    const transition = checkQuotationTransition(current, estado, { motivo: motivoRechazo });
    if (!transition.ok) throw new BadRequestException(transition.reason);
    // One path to approve: the status change also creates the project.
    if (estado === 'aprobado') return (await this.accept(id, {}, user, sessionId)).quotation;
    const quote = await this.prisma.quotation.update({
      where: { id },
      data: {
        estado,
        ...(estado === 'rechazado' ? { motivoRechazo: motivoRechazo!.trim() } : {}),
        ...(estado === 'enviado' ? { fechaEnvio: fechaEnvio ? new Date(fechaEnvio) : new Date() } : {}),
        ...(estado === 'borrador' ? { motivoRechazo: null } : {}),
      },
      include: DETAIL,
    });
    await this.prisma.touchClientActivity(current.clienteId);
    await this.audit.record({ user, sessionId, action: 'quotation.status', entity: 'quotation', id, before: current, after: quote, patch: { estado } });
    return present(quote);
  }

  /** Hides the quotation from the lists; it is kept with who, when and why, and can be restored. */
  async remove(id: string, motivo: string, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const current = await this.row(id, user);
    const error = deleteError(current, motivo);
    if (error) throw new BadRequestException(error);
    const quote = await this.prisma.quotation.update({
      where: { id },
      data: { eliminadaAt: new Date(), eliminadaPorId: user.id, motivoEliminacion: motivo.trim() },
      include: DETAIL,
    });
    await this.audit.record({ user, sessionId, action: 'quotation.delete', entity: 'quotation', id, before: current, after: quote });
    return present(quote);
  }

  async restore(id: string, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const current = await this.row(id, user);
    const error = restoreError(current);
    if (error) throw new BadRequestException(error);
    const quote = await this.prisma.quotation.update({
      where: { id },
      data: { eliminadaAt: null, eliminadaPorId: null, motivoEliminacion: null },
      include: DETAIL,
    });
    await this.audit.record({ user, sessionId, action: 'quotation.restore', entity: 'quotation', id, before: current, after: quote });
    return present(quote);
  }

  /** Approving creates the sale and the project (schedule) in one transaction; repeating it returns what exists. */
  async accept(id: string, dto: AcceptQuotationDto, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const current = await this.row(id, user);
    const error = acceptError(current);
    if (error) throw new BadRequestException(error);
    const existing = await this.prisma.schedule.findFirst({ where: { quotationId: id }, orderBy: { createdAt: 'asc' } });
    if (current.estado === 'aprobado' && current.sale && existing) {
      return { quotation: present(current), sale: current.sale, schedule: existing, alreadyConverted: true };
    }
    const { sale, schedule } = await this.prisma.$transaction(async (tx) => {
      await tx.quotation.update({ where: { id }, data: { estado: 'aprobado' } });
      const sale = current.sale ?? await tx.sale.create({
        data: {
          quotationId: id,
          total: current.monto,
          jobs: { create: { titulo: current.titulo, estado: 'programado', monto: current.monto } },
        },
        include: { jobs: true, payments: true },
      });
      const schedule = existing ?? await tx.schedule.create({
        data: projectFromQuotation(
          { ...current, monto: Number(current.monto), clienteId: current.clienteId as string },
          current.cliente?.direccion || '',
          dto,
          new Date(),
        ),
      });
      return { sale, schedule };
    });
    await this.prisma.touchClientActivity(current.clienteId);
    await this.audit.record({
      user,
      sessionId,
      action: 'quotation.approve',
      entity: 'quotation',
      id,
      patch: { estado: 'aprobado' },
      affects: existing ? [] : ['schedule', 'client'],
    });
    const quotation = await this.get(id, user);
    return { quotation, sale, schedule, alreadyConverted: Boolean(existing) };
  }
}
