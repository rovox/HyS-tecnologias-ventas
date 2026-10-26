// Visits (relevamientos y asistencias): state machine, closing checks and warranty. Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

/**
 * programado → en_camino → en_atencion → resuelto. Pendiente = waiting (material, the client, a second visit) and
 * can go back to work. Resuelto and cancelado are final: a new problem is a new visit.
 */
const VISIT_FLOW: Record<string, readonly string[]> = {
  programado: ['en_camino', 'en_atencion', 'pendiente', 'cancelado'],
  en_camino: ['en_atencion', 'pendiente', 'cancelado'],
  en_atencion: ['resuelto', 'pendiente', 'cancelado'],
  pendiente: ['programado', 'en_camino', 'en_atencion', 'cancelado'],
  resuelto: [],
  cancelado: [],
};

export function nextVisitStates(estado: string): readonly string[] {
  return VISIT_FLOW[estado] ?? [];
}

/** Resolving needs a photo as evidence; cancelling needs a reason. */
export function checkVisitTransition(from: string, to: string, ctx: { fotos: number; motivo?: string | null }): TransitionCheck {
  if (!(to in VISIT_FLOW)) return { ok: false, reason: `Estado desconocido: ${to}` };
  if (!nextVisitStates(from).includes(to)) return { ok: false, reason: `Transición no permitida: ${from} → ${to}` };
  if (to === 'resuelto' && ctx.fotos < 1) return { ok: false, reason: 'Sube al menos una foto de evidencia para marcar la visita como resuelta' };
  if (to === 'cancelado' && !ctx.motivo?.trim()) return { ok: false, reason: 'Indica el motivo de la cancelación' };
  return { ok: true };
}

/** A resolved or cancelled visit is closed: only the commercial roles still correct its texts. */
export function isClosed(estado: string): boolean {
  return estado === 'resuelto' || estado === 'cancelado';
}

type JobForWarranty = {
  estado: string;
  fechaProgramada: Date;
  fechaFinalizacion?: Date | null;
  project?: { estado: string; entregadoAt?: Date | null; garantiaMeses: number } | null;
};

const STANDALONE_WARRANTY_MONTHS = 12;

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
}

/**
 * Warranty of the work a visit revisits: a project's runs from its delivery for its own months; a stand-alone job's from
 * when it was finished, 12 months. A project not yet delivered, or a job not finished, has no warranty yet (null).
 */
export function warrantyUntil(job: JobForWarranty): Date | null {
  if (job.project) {
    if (!job.project.entregadoAt) return null;
    return addMonths(job.project.entregadoAt, job.project.garantiaMeses);
  }
  if (job.estado !== 'terminado') return null;
  return addMonths(job.fechaFinalizacion ?? job.fechaProgramada, STANDALONE_WARRANTY_MONTHS);
}

/** Whether the visit date falls within the warranty (null when there is no warranty to check). */
export function inWarranty(garantiaHasta: Date | null | undefined, fecha: Date): boolean | null {
  if (!garantiaHasta) return null;
  return fecha.getTime() <= garantiaHasta.getTime();
}

/** Money taken on the visit that counts (registered or validated) and the part still waiting to be handed in. */
export function visitPayments(movements: { monto: number | string | { toString(): string }; estado: string }[]) {
  const sum = (rows: typeof movements) => Math.round(rows.reduce((s, m) => s + Number(m.monto) * 100, 0)) / 100;
  return {
    cobrado: sum(movements.filter((m) => m.estado === 'por_validar' || m.estado === 'validado')),
    porRendir: sum(movements.filter((m) => m.estado === 'por_validar')),
  };
}
