// Projects: an approved quotation becomes a Proyecto with an official amount, jobs (trabajos), payments and a warranty.
// Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

/** planificado → en_ejecucion → entregado → cerrado; anulado from any open state. */
const PROJECT_FLOW: Record<string, readonly string[]> = {
  planificado: ['en_ejecucion', 'anulado'],
  en_ejecucion: ['entregado', 'anulado'],
  entregado: ['cerrado', 'en_ejecucion', 'anulado'],
  cerrado: [],
  anulado: [],
};

export const PROJECT_ESTADOS = Object.keys(PROJECT_FLOW);

const cents = (value: number) => Math.round(value * 100) / 100;

type ProjectState = { estado: string };

export function nextProjectStates(project: ProjectState): readonly string[] {
  return PROJECT_FLOW[project.estado] ?? [];
}

/**
 * Delivering needs every job finished or cancelled; closing needs nothing owed; cancelling is for Gerencia, with a
 * reason. `openJobs` = jobs still programado or en_proceso.
 */
export function checkProjectTransition(
  project: ProjectState,
  to: string,
  ctx: { saldo: number; isAdmin: boolean; motivo?: string | null; openJobs?: number },
): TransitionCheck {
  if (!PROJECT_ESTADOS.includes(to)) return { ok: false, reason: `Estado desconocido: ${to}` };
  if (!nextProjectStates(project).includes(to)) return { ok: false, reason: `Transición inválida: ${project.estado} → ${to}` };
  if (to === 'entregado' && (ctx.openJobs ?? 0) > 0) {
    return { ok: false, reason: `Termina o cancela los trabajos pendientes antes de entregar (${ctx.openJobs})` };
  }
  if (to === 'cerrado' && ctx.saldo > 0) return { ok: false, reason: `No se cierra un proyecto con saldo pendiente (Bs ${cents(ctx.saldo)})` };
  if (to === 'anulado' && !ctx.isAdmin) return { ok: false, reason: 'Solo Gerencia anula un proyecto' };
  if (to === 'anulado' && !ctx.motivo?.trim()) return { ok: false, reason: 'Indica el motivo de la anulación' };
  return { ok: true };
}

type PaymentRow = { tipo: string; monto: number | string | { toString(): string } };

/** Received against the official amount: advances and payments (an additional charge or a write-off are not). */
const RECEIVED = ['adelanto', 'cobro'];
/** Debt forgiven when a job is cancelled. */
const FORGIVEN = ['descuento'];

/** Money of a project from its payments: what was collected, what is still owed and the share collected. */
export function projectMoney(montoOficial: number, payments: PaymentRow[], estado: string) {
  const sum = (tipos: string[]) => cents(payments.filter((p) => tipos.includes(p.tipo)).reduce((s, p) => s + Number(p.monto), 0));
  const cobrado = sum(RECEIVED);
  const monto = Number(montoOficial);
  const saldo = estado === 'anulado' ? 0 : Math.max(0, cents(monto - cobrado - sum(FORGIVEN)));
  return { cobrado, saldo, pctCobrado: monto > 0 ? Math.min(100, Math.round((cobrado / monto) * 100)) : 0 };
}

/** Warranty starts when the project is delivered and lasts `meses` months. */
export function warranty(entregadoAt: Date | string | null | undefined, meses: number, now: Date) {
  if (!entregadoAt) return { hasta: null, vigente: false };
  const hasta = new Date(entregadoAt);
  hasta.setUTCMonth(hasta.getUTCMonth() + meses);
  return { hasta, vigente: hasta >= now };
}

/** Only Gerencia changes the official amount, always with a reason (it is the contract value). */
export function montoChangeError(ctx: { isAdmin: boolean; estado: string }, monto: number, motivo?: string | null): string | null {
  if (!ctx.isAdmin) return 'Solo Gerencia cambia el monto oficial de un proyecto';
  if (['cerrado', 'anulado'].includes(ctx.estado)) return 'El proyecto ya está cerrado o anulado';
  if (!(Number(monto) > 0)) return 'El monto debe ser mayor a 0';
  if (!motivo?.trim()) return 'Indica el motivo del cambio de monto';
  return null;
}

/** New jobs can be added while the project is open. */
export function newJobError(project: ProjectState): string | null {
  return ['cerrado', 'anulado'].includes(project.estado) ? 'El proyecto está cerrado o anulado' : null;
}

/** Project code from the quotation number: COT-102326-2 → PRY-102326-2. */
export const projectCode = (quotationNumero: string) => quotationNumero.replace(/^COT-/, 'PRY-');

/** Optional data of the first job, given when the quotation is approved. */
export type JobOptions = {
  fechaProgramada?: string;
  lugar?: string;
  tecnicoId?: string;
  horario?: string;
};

type QuoteForProject = {
  id: string;
  numero: string;
  titulo: string;
  categoriaId: string;
  monto: number;
  clienteId: string;
  sucursalId: string;
  vendedorId?: string | null;
};

/** First job of the project in the cronograma: carries the quotation total until the ledger (FIN-01). */
export function firstJobFromQuotation(quote: QuoteForProject, clientAddress: string, options: JobOptions, now: Date) {
  const monto = Number(quote.monto);
  return {
    categoriaId: quote.categoriaId,
    clienteId: quote.clienteId,
    lugar: options.lugar?.trim() || clientAddress || 'Por definir',
    descripcionTrabajo: `${quote.titulo} (${quote.numero})`,
    monto,
    adelanto: 0,
    saldo: monto,
    fechaProgramada: options.fechaProgramada ? new Date(options.fechaProgramada) : now,
    horario: options.horario || null,
    estado: 'programado',
    sucursalId: quote.sucursalId,
    vendedorId: quote.vendedorId || null,
    tecnicoId: options.tecnicoId || null,
    quotationId: quote.id,
  };
}
