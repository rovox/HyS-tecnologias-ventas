// Jobs (trabajos) in the cronograma: state machine and what can change. Money comes from the ledger (finance).
// Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

const SCHEDULE_FLOW: Record<string, readonly string[]> = {
  programado: ['en_proceso', 'cancelado'],
  en_proceso: ['terminado', 'cancelado'],
  terminado: [],
  cancelado: [],
};

export function checkScheduleTransition(from: string, to: string): TransitionCheck {
  if (!(to in SCHEDULE_FLOW)) return { ok: false, reason: `Estado desconocido: ${to}` };
  if (!(SCHEDULE_FLOW[from] ?? []).includes(to)) return { ok: false, reason: `Transición inválida: ${from} → ${to}` };
  return { ok: true };
}

/** A job from a quotation has the quotation's division: it cannot be changed on the job. */
export function categoryChangeError(current: { quotationId?: string | null; categoriaId: string }, requested?: string): string | null {
  if (requested === undefined || requested === current.categoriaId || !current.quotationId) return null;
  return 'La categoría de un trabajo de cotización es la de la cotización';
}

/** The money of a project lives in the project: its jobs have no amount of their own. */
export function montoChangeError(current: { projectId?: string | null; monto: number | string | { toString(): string } }, requested?: number): string | null {
  if (requested === undefined || !current.projectId) return null;
  if (Number(requested) === Number(current.monto)) return null;
  return 'El monto es del proyecto: los trabajos de un proyecto no tienen monto propio';
}
