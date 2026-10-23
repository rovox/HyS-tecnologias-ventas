import type { Prisma } from '@prisma/client';
import { balanceOf, expensesOf, incomeOf } from '../finance';
import { nextProjectStates, warranty } from './domain/projects.rules';

const USER_NAME = { select: { id: true, name: true } } as const;

/** Everything a project response needs: client, division, quotation link, its jobs and its ledger movements. */
export const PROJECT_DETAIL = {
  cliente: { select: { id: true, nombre: true, direccion: true } },
  categoria: { select: { id: true, label: true } },
  sucursal: { select: { id: true, nombre: true } },
  quotation: { select: { id: true, numero: true, titulo: true } },
  responsable: USER_NAME,
  schedules: { include: { tecnico: USER_NAME }, orderBy: { createdAt: 'asc' } },
  movements: {
    where: { estado: { not: 'anulado' } },
    include: { registradoPor: USER_NAME, schedule: { select: { id: true, descripcionTrabajo: true } } },
    orderBy: { fecha: 'desc' },
  },
} satisfies Prisma.ProjectInclude;

type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof PROJECT_DETAIL }>;

const cents = (value: number) => Math.round(value * 100) / 100;

/** API shape: the project plus what the UI must not compute (money from the ledger, warranty, allowed transitions). */
export function presentProject(row: ProjectRow, now = new Date()) {
  const { schedules, movements, ...project } = row;
  const monto = Number(row.montoOficial);
  const { cobrado, porValidar, adicionales } = incomeOf(movements);
  const costo = expensesOf(movements);
  const garantia = warranty(row.entregadoAt, row.garantiaMeses, now);
  return {
    ...project,
    cobrado,
    porValidar,
    adicionales,
    saldo: balanceOf(monto, cobrado, row.estado === 'anulado'),
    pctCobrado: monto > 0 ? Math.min(100, Math.round((cobrado / monto) * 100)) : 0,
    costo,
    margen: cents(monto + adicionales - costo),
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
    cobros: movements.filter((m) => m.tipo === 'ingreso'),
    gastos: movements.filter((m) => m.tipo === 'egreso'),
  };
}
