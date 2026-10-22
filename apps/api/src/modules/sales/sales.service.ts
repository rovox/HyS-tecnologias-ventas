import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateJobDto, CreatePaymentDto } from './dto/sales.dto';
import { saleWhere } from '../../common/policy/roles';

const JOB_FLOW: Record<string, string[]> = {
  programado: ['en_proceso', 'cancelado'],
  en_proceso: ['terminado', 'cancelado'],
  terminado: [],
  cancelado: [],
};

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(user: User) {
    return this.prisma.sale.findMany({
      where: saleWhere(user),
      include: { quotation: true, jobs: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, user?: User) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, ...(user ? saleWhere(user) : {}) },
      include: { quotation: true, jobs: true, payments: true },
    });
    if (!sale) throw new NotFoundException('Venta no encontrada');
    const cobrado = sale.payments.reduce((sum, row) => sum + Number(row.monto), 0);
    return { ...sale, cobrado, saldo: Number(sale.total) - cobrado };
  }

  async addJob(saleId: string, dto: CreateJobDto, user: User, sessionId?: string) {
    const sale = await this.get(saleId, user);
    const next = Number(dto.monto || 0);
    const jobsSum = sale.jobs.reduce((sum, row) => sum + Number(row.monto), 0) + next;
    if (jobsSum > Number(sale.total) + 0.009) {
      throw new BadRequestException('Los trabajos no pueden superar el total de la venta');
    }
    const job = await this.prisma.saleJob.create({
      data: {
        saleId,
        titulo: dto.titulo,
        asignadoId: dto.asignadoId,
        monto: next,
      },
    });
    await this.prisma.touchClientActivity(sale.quotation?.clienteId);
    await this.audit.record({ user, sessionId, action: 'sale.job', entity: 'sale', id: saleId });
    return job;
  }

  async updateJob(saleId: string, jobId: string, estado: string, user: User, sessionId?: string) {
    await this.get(saleId, user);
    const job = await this.prisma.saleJob.findFirst({ where: { id: jobId, saleId } });
    if (!job) throw new NotFoundException('Trabajo no encontrado');
    const allowed = JOB_FLOW[job.estado] || [];
    if (!allowed.includes(estado)) {
      throw new BadRequestException(`Transición inválida: ${job.estado} → ${estado}`);
    }
    const updated = await this.prisma.saleJob.update({ where: { id: jobId }, data: { estado } });
    await this.audit.record({ user, sessionId, action: 'sale.job.status', entity: 'sale', id: saleId });
    return updated;
  }

  async addPayment(saleId: string, dto: CreatePaymentDto, user: User, sessionId?: string) {
    const sale = await this.get(saleId, user);
    if (sale.cobrado + dto.monto > Number(sale.total) + 0.009) {
      throw new BadRequestException('El pago supera el total de la venta');
    }
    const payment = await this.prisma.salePayment.create({
      data: {
        saleId,
        monto: dto.monto,
        metodo: dto.metodo || '',
        nota: dto.nota || '',
      },
    });
    await this.audit.record({ user, sessionId, action: 'sale.payment', entity: 'sale', id: saleId });
    return payment;
  }
}
