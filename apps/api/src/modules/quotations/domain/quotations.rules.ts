// Quotations: state machine and acceptance (a quotation accepted becomes a Proyecto). Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

const QUOTATION_FLOW: Record<string, readonly string[]> = {
  borrador: ['enviado', 'rechazado'],
  enviado: ['aceptado', 'rechazado', 'borrador'],
  aceptado: ['rechazado'],
  rechazado: ['borrador'],
};

export function checkQuotationTransition(from: string, to: string, hasPdf: boolean): TransitionCheck {
  if (!(to in QUOTATION_FLOW)) return { ok: false, reason: `Estado desconocido: ${to}` };
  if (!(QUOTATION_FLOW[from] ?? []).includes(to)) return { ok: false, reason: `Transición inválida: ${from} → ${to}` };
  if (to === 'enviado' && !hasPdf) return { ok: false, reason: 'Adjunta el PDF antes de enviar la cotización' };
  return { ok: true };
}

type AcceptableQuote = { estado: string; clienteId?: string | null };

/** Why a quotation cannot be accepted, or null. Accepting an already accepted one is allowed (idempotent). */
export function acceptError(quote: AcceptableQuote): string | null {
  if (quote.estado === 'rechazado') return 'Una cotización rechazada no se puede aceptar';
  if (quote.estado !== 'enviado' && quote.estado !== 'aceptado') return 'Solo se acepta una cotización enviada';
  if (!quote.clienteId) return 'Asigna un cliente a la cotización antes de aceptarla';
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

/** Schedule row created when a quotation is accepted: official amount = quotation total, no advance yet. */
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
