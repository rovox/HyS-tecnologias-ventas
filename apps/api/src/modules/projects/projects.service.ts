import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { assertCanManageProjects, isAdmin } from '../../common/policy/roles';
import { SchedulesService } from '../schedules';
import { CreateProjectJobDto, ListProjectsQuery, ProjectPaymentDto, ProjectStatusDto, UpdateProjectDto } from './dto/project.dto';
import { checkProjectTransition, firstJobFromQuotation, newJobError, projectCode, type JobOptions } from './domain/projects.rules';
import { PROJECT_DETAIL, presentProject } from './project.presenter';

type Tx = Prisma.TransactionClient;

type ApprovedQuote = {
  id: string;
  numero: string;
  titulo: string;
  categoriaId: string;
  monto: number;
  clienteId: string;
  sucursalId: string;
  vendedorId?: string | null;
  cliente?: { direccion?: string | null } | null;
};

/** Proyectos: an approved quotation with its official amount, jobs, payments and warranty. */
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly schedules: SchedulesService,
  ) {}

  async list(query: ListProjectsQuery, user: User) {
    assertCanManageProjects(user);
    const rows = await this.prisma.project.findMany({
      where: { ...(query.estado ? { estado: query.estado } : {}), ...(query.clienteId ? { clienteId: query.clienteId } : {}) },
      include: PROJECT_DETAIL,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const now = new Date();
    return rows.map((row) => presentProject(row, now));
  }

  private async row(id: string) {
    const row = await this.prisma.project.findUnique({ where: { id }, include: PROJECT_DETAIL });
    if (!row) throw new NotFoundException('Proyecto no encontrado');
    return row;
  }

  async get(id: string, user: User) {
    assertCanManageProjects(user);
    return presentProject(await this.row(id));
  }

  /** Called inside the transaction that approves the quotation: the project and its first job, once. */
  async createFromQuotation(tx: Tx, quote: ApprovedQuote, options: JobOptions) {
    const project = await tx.project.create({
      data: {
        codigo: projectCode(quote.numero),
        quotationId: quote.id,
        clienteId: quote.clienteId,
        categoriaId: quote.categoriaId,
        sucursalId: quote.sucursalId,
        titulo: quote.titulo.slice(0, 300),
        montoOficial: quote.monto,
        responsableId: quote.vendedorId || null,
      },
    });
    const schedule = await this.schedules.createFirstJob(tx, {
      ...firstJobFromQuotation(quote, quote.cliente?.direccion || '', options, new Date()),
      projectId: project.id,
    });
    return { project, schedule };
  }

  async update(id: string, dto: UpdateProjectDto, user: User, sessionId?: string) {
    assertCanManageProjects(user);
    const before = await this.row(id);
    const after = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
        ...(dto.garantiaMeses !== undefined ? { garantiaMeses: dto.garantiaMeses } : {}),
        ...(dto.responsableId !== undefined ? { responsableId: dto.responsableId || null } : {}),
      },
      include: PROJECT_DETAIL,
    });
    await this.audit.record({ user, sessionId, action: 'project.update', entity: 'project', id, before, after, affects: ['client'] });
    return presentProject(after);
  }

  async changeStatus(id: string, dto: ProjectStatusDto, user: User, sessionId?: string) {
    assertCanManageProjects(user);
    const before = await this.row(id);
    const { saldo } = presentProject(before);
    const check = checkProjectTransition(before, dto.estado, { saldo, isAdmin: isAdmin(user), motivo: dto.motivo });
    if (!check.ok) throw new BadRequestException(check.reason);
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id },
        data: {
          estado: dto.estado,
          ...(dto.estado === 'entregado' ? { entregadoAt: now } : {}),
          ...(dto.estado === 'en_ejecucion' ? { entregadoAt: null } : {}),
          ...(dto.estado === 'cerrado' ? { cerradoAt: now } : {}),
          ...(dto.estado === 'anulado' ? { motivoAnulacion: dto.motivo!.trim() } : {}),
        },
      });
      if (dto.estado === 'anulado') await this.schedules.cancelOpenJobs(tx, id);
    });
    const after = await this.row(id);
    await this.audit.record({
      user,
      sessionId,
      action: 'project.status',
      entity: 'project',
      id,
      before,
      after,
      affects: ['schedule', 'client'],
      patch: { estado: dto.estado },
    });
    return presentProject(after);
  }

  /** A new job of the project in the cronograma (same client, quotation and division). */
  async addJob(id: string, dto: CreateProjectJobDto, user: User, sessionId?: string) {
    assertCanManageProjects(user);
    const project = await this.row(id);
    const error = newJobError(project);
    if (error) throw new BadRequestException(error);
    await this.schedules.create(
      {
        ...dto,
        clienteId: project.clienteId,
        sucursalId: project.sucursalId,
        quotationId: project.quotationId,
        lugar: dto.lugar || project.cliente.direccion || '',
        monto: 0,
      },
      user,
      sessionId,
      { projectId: id },
    );
    return this.get(id, user);
  }

  /** Until the ledger (FIN-01) a project's payment is booked on its main job (the one carrying the amount). */
  async registerPayment(id: string, dto: ProjectPaymentDto, user: User, sessionId?: string) {
    assertCanManageProjects(user);
    const project = await this.row(id);
    if (project.estado === 'anulado') throw new BadRequestException('El proyecto está anulado');
    const main = project.schedules.find((s) => Number(s.monto) > 0) ?? project.schedules[0];
    if (!main) throw new BadRequestException('El proyecto no tiene trabajos');
    await this.schedules.registerPayment(main.id, dto, user, sessionId);
    return this.get(id, user);
  }
}
