import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { clientWhere } from '../../common/policy/roles';
import { balanceOf, incomeOf } from '../finance';
import { warranty } from '../projects';
import { clientStatus } from './domain/clients.report';

const MONEY = { select: { tipo: true, concepto: true, monto: true, estado: true } } as const;
const LINES = {
  projects: { select: { id: true, codigo: true, titulo: true, estado: true, montoOficial: true, entregadoAt: true, garantiaMeses: true, categoria: { select: { id: true, label: true } }, movements: MONEY } },
  schedules: {
    where: { projectId: null },
    select: { id: true, descripcionTrabajo: true, estado: true, monto: true, fechaProgramada: true, categoria: { select: { id: true, label: true } }, movements: MONEY },
  },
} satisfies Prisma.ClientInclude;

type WithLines = Prisma.ClientGetPayload<{ include: typeof LINES }>;

/** Money of each project and stand-alone job of a client, from the ledger. */
function lines(row: WithLines, now: Date) {
  const projects = row.projects.map(({ movements, ...p }) => {
    const { cobrado } = incomeOf(movements);
    const g = warranty(p.entregadoAt, p.garantiaMeses, now);
    return { ...p, monto: p.montoOficial, cobrado, saldo: balanceOf(Number(p.montoOficial), cobrado, p.estado === 'anulado'), garantiaHasta: g.hasta, garantiaVigente: g.vigente };
  });
  const jobs = row.schedules.map(({ movements, ...j }) => {
    const { cobrado } = incomeOf(movements);
    return { ...j, cobrado, saldo: balanceOf(Number(j.monto), cobrado, j.estado === 'cancelado') };
  });
  return { projects, jobs };
}

/** Client read model across quotations, projects, jobs and the ledger (read-only; it writes nothing). */
@Injectable()
export class ClientReportService {
  constructor(private readonly prisma: PrismaService) {}

  /** Every client with what it owes and whether it has a service in course. */
  async clients(user: User) {
    const rows = await this.prisma.client.findMany({
      where: clientWhere(user),
      include: { ...LINES, sucursal: { select: { id: true, nombre: true } }, _count: { select: { quotations: true } } },
      orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
    });
    const now = new Date();
    return rows.map((row) => {
      const { projects: _p, schedules: _s, ...client } = row;
      const { projects, jobs } = lines(row, now);
      return { ...client, ...clientStatus(projects, jobs), cotizaciones: row._count.quotations };
    });
  }

  /** The client page: projects with warranty, stand-alone jobs, quotations, payments and visits. */
  async client(id: string, user: User) {
    const row = await this.prisma.client.findFirst({
      where: { id, ...clientWhere(user) },
      include: {
        ...LINES,
        sucursal: { select: { id: true, nombre: true } },
        quotations: {
          select: { id: true, numero: true, titulo: true, estado: true, monto: true, eliminadaAt: true, createdAt: true, categoria: { select: { label: true } } },
          orderBy: { createdAt: 'desc' },
        },
        movements: {
          where: { tipo: 'ingreso', estado: { not: 'anulado' } },
          select: { id: true, concepto: true, monto: true, estado: true, fecha: true, metodo: true, project: { select: { id: true, codigo: true } }, schedule: { select: { id: true, descripcionTrabajo: true } } },
          orderBy: { fecha: 'desc' },
        },
        relevamientos: { select: { id: true, fecha: true, estado: true, lugar: true, tipoVisita: true }, orderBy: { fecha: 'desc' } },
      },
    });
    // Equipment delivered to the client's projects (through internal orders), covered by the project's warranty.
    const delivered = row
      ? await this.prisma.stockMovement.findMany({
          where: { tipo: 'salida_proyecto', project: { clienteId: row.id }, producto: { tipo: 'equipo' } },
          select: { id: true, cantidad: true, fecha: true, projectId: true, producto: { select: { id: true, codigo: true, nombre: true, marca: true } } },
          orderBy: { fecha: 'desc' },
        })
      : [];
    if (!row) throw new NotFoundException('Cliente no encontrado');
    const { projects: _p, schedules: _s, quotations, movements, relevamientos, ...client } = row;
    const { projects, jobs } = lines(row, new Date());
    const byProject = new Map(projects.map((p) => [p.id, p]));
    const equipos = delivered.map((e) => {
      const p = byProject.get(e.projectId!);
      return { ...e, proyecto: p ? { id: p.id, codigo: p.codigo } : null, garantiaHasta: p?.garantiaHasta ?? null, garantiaVigente: p?.garantiaVigente ?? false };
    });
    return { ...client, ...clientStatus(projects, jobs), proyectos: projects, trabajos: jobs, cotizaciones: quotations, cobros: movements, relevamientos, equipos };
  }
}
