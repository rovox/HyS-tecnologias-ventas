// Quotations: states, validity, deletion and acceptance (an approved quotation becomes a Proyecto).
// Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

/** Owner decision: a sent quotation is valid 15 days, then it expires (`vencido`). */
const VALIDITY_DAYS = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

const OPEN_ESTADOS = ['borrador', 'enviado'] as const;
const CLOSED_ESTADOS = ['aprobado', 'rechazado', 'vencido'] as const;
const QUOTATION_ESTADOS = [...OPEN_ESTADOS, ...CLOSED_ESTADOS];

/** What a user can do from each state. `vencido` is set by the system only; `aprobado` is final (cancel the project). */
const QUOTATION_FLOW: Record<string, readonly string[]> = {
  borrador: ['enviado'],
  enviado: ['aprobado', 'rechazado', 'borrador'],
  rechazado: ['borrador'],
  vencido: ['aprobado', 'borrador'],
  aprobado: [],
};

type QuoteState = { estado: string; eliminadaAt?: Date | string | null };

const isDeleted = (quote: QuoteState) => Boolean(quote.eliminadaAt);

/** Transitions the user may trigger now (a deleted quotation has none until it is restored). */
export function nextStates(quote: QuoteState): readonly string[] {
  return isDeleted(quote) ? [] : (QUOTATION_FLOW[quote.estado] ?? []);
}

export function checkQuotationTransition(
  quote: QuoteState & { archivoPdfUrl?: string | null },
  to: string,
  input: { motivo?: string | null } = {},
): TransitionCheck {
  if (isDeleted(quote)) return { ok: false, reason: 'Restaura la cotización antes de cambiar su estado' };
  if (!QUOTATION_ESTADOS.includes(to as never)) return { ok: false, reason: `Estado desconocido: ${to}` };
  if (!nextStates(quote).includes(to)) return { ok: false, reason: `Transición inválida: ${quote.estado} → ${to}` };
  if (to === 'enviado' && !quote.archivoPdfUrl) return { ok: false, reason: 'Adjunta el PDF antes de enviar la cotización' };
  if (to === 'rechazado' && !input.motivo?.trim()) return { ok: false, reason: 'Indica el motivo del rechazo' };
  return { ok: true };
}

type AcceptableQuote = QuoteState & { clienteId?: string | null };

/** Why a quotation cannot be approved, or null. Approving an already approved one is allowed (idempotent). */
export function acceptError(quote: AcceptableQuote): string | null {
  if (isDeleted(quote)) return 'Restaura la cotización antes de aprobarla';
  if (quote.estado === 'rechazado') return 'Una cotización rechazada no se puede aprobar: reábrela primero';
  if (!['enviado', 'vencido', 'aprobado'].includes(quote.estado)) return 'Solo se aprueba una cotización enviada';
  if (!quote.clienteId) return 'Asigna un cliente a la cotización antes de aprobarla';
  return null;
}

/** Last valid day of a sent quotation. */
export function expiresAt(fechaEnvio: Date | string | null | undefined): Date | null {
  return fechaEnvio ? new Date(new Date(fechaEnvio).getTime() + VALIDITY_DAYS * DAY_MS) : null;
}

/** Sent date before which an `enviado` quotation has expired. */
export function expiryCutoff(now: Date): Date {
  return new Date(now.getTime() - VALIDITY_DAYS * DAY_MS);
}

export function isExpired(quote: QuoteState & { fechaEnvio?: Date | string | null }, now: Date): boolean {
  const end = expiresAt(quote.fechaEnvio);
  return quote.estado === 'enviado' && !isDeleted(quote) && end !== null && end < now;
}

/** Deleting hides the quotation (it is kept, with the reason, and can be restored). An approved one has a project. */
export function deleteError(quote: QuoteState, motivo?: string | null): string | null {
  if (isDeleted(quote)) return 'La cotización ya está eliminada';
  if (quote.estado === 'aprobado') return 'Una cotización aprobada no se elimina: cancela su proyecto';
  if (!motivo?.trim()) return 'Indica el motivo de la eliminación';
  return null;
}

export function restoreError(quote: QuoteState): string | null {
  return isDeleted(quote) ? null : 'La cotización no está eliminada';
}

/** Fields fixed once approved: they are the project's official data (changed by Gerencia from the project). */
const FIXED_WHEN_APPROVED = ['monto', 'clienteId', 'categoriaId'] as const;

/** A quotation is always editable, except while deleted and, once approved, its amount, client and division. */
export function editError(quote: QuoteState, changes: Record<string, unknown>): string | null {
  if (isDeleted(quote)) return 'Restaura la cotización antes de editarla';
  if (quote.estado === 'aprobado' && FIXED_WHEN_APPROVED.some((key) => changes[key] !== undefined)) {
    return 'En una cotización aprobada el monto, el cliente y la categoría son los del proyecto';
  }
  return null;
}

/** "Abiertas" are in progress; "cerradas" are approved, rejected, expired or deleted. */
export function vistaFilter(vista?: string): { estados: readonly string[]; eliminadas: boolean | null } | null {
  if (vista === 'abiertas') return { estados: OPEN_ESTADOS, eliminadas: false };
  if (vista === 'cerradas') return { estados: CLOSED_ESTADOS, eliminadas: null };
  return null;
}

export type ProjectOptions = {
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

/** Schedule row created when a quotation is approved: official amount = quotation total, no advance yet. */
export function projectFromQuotation(quote: QuoteForProject, clientAddress: string, options: ProjectOptions, now: Date) {
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
