// Tasks: minimal follow-ups (call, send a PDF, visit) that can become a quotation. Pure TS, no Nest, no Prisma.

import { businessToday, dayOf } from '../../../common/domain/calendar';

export const TASK_ESTADOS = ['pendiente', 'completada', 'descartada'] as const;
export const TASK_PRIORIDADES = ['alta', 'media', 'baja'] as const;

const PRIORITY_ORDER: Record<string, number> = { alta: 0, media: 1, baja: 2 };

type TaskLike = {
  estado: string;
  prioridad: string;
  plazo?: Date | string | null;
  asignadoId?: string | null;
  creadorId: string;
};

/** A pending task whose due day (in Bolivia) has passed. */
export function isOverdue(task: Pick<TaskLike, 'estado' | 'plazo'>, now: Date): boolean {
  return task.estado === 'pendiente' && Boolean(task.plazo) && dayOf(task.plazo!) < businessToday(now);
}

/** Urgent first, then the earliest due date; tasks without a date last. */
export function compareTasks(a: TaskLike, b: TaskLike): number {
  const pa = PRIORITY_ORDER[a.prioridad] ?? 9;
  const pb = PRIORITY_ORDER[b.prioridad] ?? 9;
  if (pa !== pb) return pa - pb;
  const ta = a.plazo ? new Date(a.plazo).getTime() : Infinity;
  const tb = b.plazo ? new Date(b.plazo).getTime() : Infinity;
  return ta - tb;
}

/** Counters of the always-visible tasks badge: mine, unassigned (anyone can take them) and overdue. */
export function pendingSummary(tasks: TaskLike[], userId: string, now: Date) {
  const pending = tasks.filter((t) => t.estado === 'pendiente');
  const mine = pending.filter((t) => t.asignadoId === userId || (!t.asignadoId && t.creadorId === userId));
  return {
    mias: mine.length,
    sinAsignar: pending.filter((t) => !t.asignadoId).length,
    vencidas: mine.filter((t) => isOverdue(t, now)).length,
  };
}

/** Why a task cannot become a quotation, or null. */
export function convertError(task: Pick<TaskLike, 'estado'> & { cotizacionId?: string | null }): string | null {
  if (task.cotizacionId) return 'Esta tarea ya tiene una cotización';
  if (task.estado !== 'pendiente') return 'Solo una tarea pendiente se convierte en cotización';
  return null;
}
