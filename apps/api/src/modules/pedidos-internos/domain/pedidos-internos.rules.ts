// Internal orders (pedidos internos): state machine and money rules. Pure TS, no Nest, no Prisma.

import type { TransitionCheck } from '../../../common/domain/state-machine';

const PEDIDO_FLOW: Record<string, readonly string[]> = {
  solicitado: ['aprobado', 'rechazado', 'cancelado'],
  aprobado: ['en_preparación', 'cancelado'],
  en_preparación: ['listo_para_entrega', 'cancelado'],
  listo_para_entrega: ['entregado'],
  entregado: [],
  rechazado: [],
  cancelado: [],
};

export const PEDIDO_ESTADOS = Object.keys(PEDIDO_FLOW);

export function nextStates(estado: string): readonly string[] {
  return PEDIDO_FLOW[estado] ?? [];
}

export function checkTransition(from: string, to: string): TransitionCheck {
  if (!(to in PEDIDO_FLOW)) return { ok: false, reason: `Estado desconocido: ${to}` };
  if (!nextStates(from).includes(to)) return { ok: false, reason: `Transición no permitida: ${from} → ${to}` };
  return { ok: true };
}

type ItemCost = { cantidad: number; costoUnitario?: number | null };

/** Line total in Bs, rounded to cents; an item without a unit cost counts as 0. */
export function itemTotal(item: ItemCost): number {
  return Math.round(item.cantidad * (item.costoUnitario ?? 0) * 100) / 100;
}

export function pedidoTotal(items: ItemCost[]): number {
  return Math.round(items.reduce((sum, item) => sum + itemTotal(item) * 100, 0)) / 100;
}

/** Fields written when an order is delivered: real date and who delivered it. Empty for any other state. */
export function deliveryFields(
  estado: string,
  input: { fechaEntrega?: string; entregadoPorId?: string },
  actorId: string,
  now: Date,
): { fechaEntregaReal?: Date; entregadoPorId?: string } {
  if (estado !== 'entregado') return {};
  return {
    fechaEntregaReal: input.fechaEntrega ? new Date(input.fechaEntrega) : now,
    entregadoPorId: input.entregadoPorId || actorId,
  };
}

/** A delivered order already moved stock: it is kept (cancel the movements with an inventory adjustment instead). */
export function deleteError(estado: string): string | null {
  return estado === 'entregado' ? 'Un pedido entregado no se elimina: ya movió stock' : null;
}

/** Rejecting or cancelling an order needs a reason (it stays as a comment and in the history). */
export function transitionNeedsReason(to: string): boolean {
  return to === 'rechazado' || to === 'cancelado';
}

/** Short code people can say and search: PED- plus the first 6 characters of the id. */
export function orderCode(id: string): string {
  return `PED-${id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}`;
}
