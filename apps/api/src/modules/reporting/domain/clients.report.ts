// Client read model: what a client owes and whether it has a service in course. Pure TS, no Nest, no Prisma.

type Money = number | string | { toString(): string };

export type ProjectLine = { estado: string; monto: Money; cobrado: number; saldo: number };
export type JobLine = { estado: string; monto: Money; saldo: number };

const cents = (value: number) => Math.round(value * 100) / 100;
const OPEN_PROJECT = ['planificado', 'en_ejecucion', 'entregado'];
const OPEN_JOB = ['programado', 'en_proceso'];

/**
 * Owner decision (2026-10-22): a client is "with service in course" only while a project or job is in progress or
 * something is still owed. It is a filter, never a tag.
 */
export function clientStatus(projects: ProjectLine[], jobs: JobLine[]) {
  const saldoPendiente = cents([...projects, ...jobs].reduce((sum, x) => sum + x.saldo, 0));
  const proyectosEnCurso = projects.filter((p) => OPEN_PROJECT.includes(p.estado)).length;
  const trabajosEnCurso = jobs.filter((j) => OPEN_JOB.includes(j.estado)).length;
  const totalContratado = cents(
    [...projects.filter((p) => p.estado !== 'anulado'), ...jobs.filter((j) => j.estado !== 'cancelado')].reduce((sum, x) => sum + Number(x.monto), 0),
  );
  return {
    saldoPendiente,
    proyectosEnCurso,
    trabajosEnCurso,
    totalContratado,
    servicioEnCurso: proyectosEnCurso > 0 || trabajosEnCurso > 0 || saldoPendiente > 0,
  };
}
