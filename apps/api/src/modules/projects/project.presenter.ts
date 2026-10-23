import type { Prisma } from '@prisma/client';
import { nextProjectStates, projectMoney, warranty } from './domain/projects.rules';

const USER_NAME = { select: { id: true, name: true } } as const;

/** Everything a project response needs: client, division, quotation link, its jobs and their payments. */
export const PROJECT_DETAIL = {
  cliente: { select: { id: true, nombre: true, direccion: true } },
  categoria: { select: { id: true, label: true } },
  sucursal: { select: { id: true, nombre: true } },
  quotation: { select: { id: true, numero: true, titulo: true } },
  responsable: USER_NAME,
  schedules: {
    include: { tecnico: USER_NAME, payments: { include: { cobradoPor: USER_NAME }, orderBy: { at: 'desc' } } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof PROJECT_DETAIL }>;

/** API shape: the project plus what the UI must not compute (money, warranty, allowed transitions). */
export function presentProject(row: ProjectRow, now = new Date()) {
  const { schedules, ...project } = row;
  const payments = schedules.flatMap((s) => s.payments.map((p) => ({ ...p, trabajo: s.descripcionTrabajo })));
  const money = projectMoney(Number(row.montoOficial), payments, row.estado);
  const garantia = warranty(row.entregadoAt, row.garantiaMeses, now);
  return {
    ...project,
    ...money,
    garantiaHasta: garantia.hasta,
    garantiaVigente: garantia.vigente,
    transicionesValidas: nextProjectStates(row),
    trabajos: schedules.map((s) => ({
      id: s.id,
      descripcionTrabajo: s.descripcionTrabajo,
      estado: s.estado,
      fechaProgramada: s.fechaProgramada,
      horario: s.horario,
      tecnico: s.tecnico,
    })),
    cobros: payments.sort((a, b) => +new Date(b.at) - +new Date(a.at)),
  };
}
